import { db } from '../db/connection';
import { 
  swipeActionsTable, 
  matchesTable, 
  swipePreferencesTable, 
  swipeStatsTable,
  swipeQueueTable,
  NewSwipeAction,
  NewMatch,
  NewSwipePreferences,
  NewSwipeStats
} from '../db/Schemas/swipeGame';
import { usersTable, profilesTable } from '../db/Schemas';
import { eq, and, or, desc, asc, sql, ne, notInArray, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketService } from './websocketService';

export class SwipeService {
  
  // Potentielle Matches für User laden
  static async getPotentialMatches(userId: string, limit: number = 20) {
    try {
      console.log('🔍 SwipeService: Getting potential matches for user:', userId);

      // User-Präferenzen laden
      const preferences = await this.getUserPreferences(userId);
      const userProfile = await this.getUserProfile(userId);

      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Bereits geswipte User ausschließen
      const swipedUserIds = await db
        .select({ targetId: swipeActionsTable.targetId })
        .from(swipeActionsTable)
        .where(eq(swipeActionsTable.swiperId, userId));

      const excludedIds = [userId, ...swipedUserIds.map(s => s.targetId)];

      // Potentielle Matches basierend auf Präferenzen finden
      const potentialMatches = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          dateOfBirth: usersTable.dateOfBirth,
          location: usersTable.location,
          bio: profilesTable.bio,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          avatarId: profilesTable.avatarId,
          profileVisibility: profilesTable.profileVisibility,
          lastActivityAt: usersTable.lastActivityAt,
        })
        .from(usersTable)
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            notInArray(usersTable.id, excludedIds),
            eq(usersTable.accountStatus, 'active'),
            eq(profilesTable.profileVisibility, 'public'),
            preferences.onlyShowActiveUsers ? 
              sql`${usersTable.lastActivityAt} > NOW() - INTERVAL '7 days'` : 
              sql`1=1`
          )
        )
        .orderBy(desc(usersTable.lastActivityAt))
        .limit(limit);

      // Kompatibilitätsscore berechnen
      const enrichedMatches = await Promise.all(
        potentialMatches.map(async (match) => {
          const compatibility = await this.calculateCompatibility(userProfile, match);
          const distance = this.calculateDistance(userProfile.location, match.location);
          
          return {
            ...match,
            compatibilityScore: compatibility.score,
            commonInterests: compatibility.commonInterests,
            distance: distance,
            age: this.calculateAge(match.dateOfBirth),
          };
        })
      );

      // Nach Kompatibilität filtern und sortieren
      const filteredMatches = enrichedMatches
        .filter(match => {
          // Entfernungsfilter
          if (match.distance !== null && preferences.maxDistance < match.distance) {
            return false;
          }
          
          // Altersfilter
          if (match.age !== null && (match.age < preferences.minAge || match.age > preferences.maxAge)) {
            return false;
          }
          
          // Gemeinsame Interessen erforderlich
          if (preferences.requireCommonInterests && 
              match.commonInterests.length < preferences.minCommonInterests) {
            return false;
          }
          
          return true;
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      console.log('🔍 SwipeService: Found potential matches:', filteredMatches.length);
      
      return {
        success: true,
        data: {
          matches: filteredMatches,
          hasMore: filteredMatches.length === limit,
          filters: preferences
        }
      };

    } catch (error) {
      console.error('❌ SwipeService: Error getting potential matches:', error);
      return { success: false, error: 'Failed to load potential matches' };
    }
  }

  // Swipe-Aktion verarbeiten
  static async processSwipe(swiperId: string, targetId: string, action: 'like' | 'skip' | 'super_like') {
    try {
      console.log('💫 SwipeService: Processing swipe:', { swiperId, targetId, action });

      // Prüfen ob bereits geswipet
      const existingSwipe = await db
        .select()
        .from(swipeActionsTable)
        .where(
          and(
            eq(swipeActionsTable.swiperId, swiperId),
            eq(swipeActionsTable.targetId, targetId)
          )
        )
        .limit(1);

      if (existingSwipe.length > 0) {
        return { success: false, error: 'Already swiped on this user' };
      }

      // Swipe-Aktion speichern
      const swipeId = uuidv4();
      await db.insert(swipeActionsTable).values({
        id: swipeId,
        swiperId,
        targetId,
        action,
        timestamp: new Date(),
        isActive: true,
        context: { source: 'swipe_game' }
      });

      // Statistiken aktualisieren
      await this.updateSwipeStats(swiperId, action);

      let matchResult = null;

      // Bei Like prüfen ob Match entstanden ist
      if (action === 'like' || action === 'super_like') {
        console.log('💘 SwipeService: Checking for potential match...');
        
        // Prüfen ob Target auch geliked hat
        const reciprocalLike = await db
          .select()
          .from(swipeActionsTable)
          .where(
            and(
              eq(swipeActionsTable.swiperId, targetId),
              eq(swipeActionsTable.targetId, swiperId),
              inArray(swipeActionsTable.action, ['like', 'super_like'])
            )
          )
          .limit(1);

        if (reciprocalLike.length > 0) {
          console.log('🎉 SwipeService: Match detected! Creating match...');
          matchResult = await this.createMatch(swiperId, targetId);
        }
      }

      return {
        success: true,
        data: {
          swipeId,
          action,
          match: matchResult,
          isMatch: !!matchResult
        }
      };

    } catch (error) {
      console.error('❌ SwipeService: Error processing swipe:', error);
      return { success: false, error: 'Failed to process swipe' };
    }
  }

  // Match erstellen
  static async createMatch(user1Id: string, user2Id: string) {
    try {
      console.log('💝 SwipeService: Creating match between users:', { user1Id, user2Id });

      // Prüfen ob Match bereits existiert
      const existingMatch = await db
        .select()
        .from(matchesTable)
        .where(
          or(
            and(eq(matchesTable.user1Id, user1Id), eq(matchesTable.user2Id, user2Id)),
            and(eq(matchesTable.user1Id, user2Id), eq(matchesTable.user2Id, user1Id))
          )
        )
        .limit(1);

      if (existingMatch.length > 0) {
        console.log('⚠️ SwipeService: Match already exists');
        return existingMatch[0];
      }

      // User-Profile für Kompatibilitätsscore laden
      const user1Profile = await this.getUserProfile(user1Id);
      const user2Profile = await this.getUserProfile(user2Id);

      if (!user1Profile || !user2Profile) {
        throw new Error('User profiles not found');
      }

      // Kompatibilitätsscore berechnen
      const compatibility = await this.calculateCompatibility(user1Profile, user2Profile);

      // Match erstellen
      const matchId = uuidv4();
      const newMatch = await db.insert(matchesTable).values({
        id: matchId,
        user1Id,
        user2Id,
        matchedAt: new Date(),
        isActive: true,
        matchQuality: compatibility.score,
        commonInterests: compatibility.commonInterests,
        lastInteraction: new Date(),
        status: 'active'
      }).returning();

      // Match-Statistiken aktualisieren
      await this.updateMatchStats(user1Id);
      await this.updateMatchStats(user2Id);

      // WebSocket-Benachrichtigung senden
      await this.sendMatchNotification(user1Id, user2Id, newMatch[0]);

      console.log('✅ SwipeService: Match created successfully:', matchId);

      // Create friendship after match
      try {
        const { FriendshipService } = require('./friendshipService');
        const friendshipResult = await FriendshipService.createFriendship(user1Id, user2Id, 'match');
        console.log('✅ SwipeService: Friendship creation result:', friendshipResult);

        if (!friendshipResult.success) {
          throw new Error(`Failed to create friendship: ${friendshipResult.error}`);
        }
      } catch (friendshipError) {
        console.error('⚠️ SwipeService: Could not create friendship from match:', friendshipError);
        // Füge detaillierteres Logging mit Type-Guard hinzu
        console.error('Details:', {
          user1Id, 
          user2Id,
          errorMessage: friendshipError instanceof Error ? friendshipError.message : String(friendshipError),
          errorStack: friendshipError instanceof Error ? friendshipError.stack : undefined
        });
      }
      
      return newMatch[0];

    } catch (error) {
      console.error('❌ SwipeService: Error creating match:', error);
      throw error;
    }
  }

  // User-Präferenzen laden oder erstellen
  static async getUserPreferences(userId: string) {
    try {
      let preferences = await db
        .select()
        .from(swipePreferencesTable)
        .where(eq(swipePreferencesTable.userId, userId))
        .limit(1);

      if (preferences.length === 0) {
        // Standard-Präferenzen erstellen
        const defaultPreferences: NewSwipePreferences = {
          userId,
          maxDistance: 50,
          minAge: 18,
          maxAge: 99,
          showMe: 'everyone',
          requireCommonInterests: false,
          minCommonInterests: 1,
          excludeAlreadySwiped: true,
          onlyShowActiveUsers: true,
          preferredHobbies: [],
          dealbreakers: [],
          isVisible: true,
          isPremium: false,
          lastUpdated: new Date()
        };

        await db.insert(swipePreferencesTable).values(defaultPreferences);
        preferences = [defaultPreferences as any];
      }

      return preferences[0];
    } catch (error) {
      console.error('❌ SwipeService: Error getting user preferences:', error);
      throw error;
    }
  }

  // User-Profil laden
  static async getUserProfile(userId: string) {
    try {
      const profile = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          dateOfBirth: usersTable.dateOfBirth,
          location: usersTable.location,
          bio: profilesTable.bio,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          avatarId: profilesTable.avatarId,
          profileVisibility: profilesTable.profileVisibility,
          lastActivityAt: usersTable.lastActivityAt,
        })
        .from(usersTable)
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(usersTable.id, userId))
        .limit(1);

      return profile[0] || null;
    } catch (error) {
      console.error('❌ SwipeService: Error getting user profile:', error);
      return null;
    }
  }

  // Kompatibilitätsscore berechnen
  static async calculateCompatibility(user1Profile: any, user2Profile: any) {
    try {
      let score = 0;
      const commonInterests = [];

      // Gemeinsame Interessen
      const user1Interests = user1Profile.interests || [];
      const user2Interests = user2Profile.interests || [];
      
      const sharedInterests = user1Interests.filter((interest: string) => 
        user2Interests.includes(interest)
      );

      // Gemeinsame Hobbys
      const user1Hobbies = user1Profile.hobbies || [];
      const user2Hobbies = user2Profile.hobbies || [];
      
      const sharedHobbies = user1Hobbies.filter((hobby: string) => 
        user2Hobbies.includes(hobby)
      );

      // Score-Berechnung
      score += sharedInterests.length * 20; // 20 Punkte pro gemeinsames Interesse
      score += sharedHobbies.length * 15;   // 15 Punkte pro gemeinsames Hobby

      // Aktivitäts-Bonus
      const daysSinceLastActivity = this.daysSince(user2Profile.lastActivityAt);
      if (daysSinceLastActivity <= 1) score += 10;
      else if (daysSinceLastActivity <= 7) score += 5;

      // Profilvollständigkeit
      if (user2Profile.bio && user2Profile.bio.length > 20) score += 5;
      if (user2Profile.avatarId) score += 5;

      // Gemeinsame Interessen/Hobbys sammeln
      commonInterests.push(...sharedInterests.map((item: string) => ({ type: 'interest', value: item })));
      commonInterests.push(...sharedHobbies.map((item: string) => ({ type: 'hobby', value: item })));

      return {
        score: Math.min(score, 100), // Max 100 Punkte
        commonInterests,
        breakdown: {
          sharedInterests: sharedInterests.length,
          sharedHobbies: sharedHobbies.length,
          activityBonus: daysSinceLastActivity <= 7,
          profileComplete: !!(user2Profile.bio && user2Profile.avatarId)
        }
      };

    } catch (error) {
      console.error('❌ SwipeService: Error calculating compatibility:', error);
      return { score: 0, commonInterests: [], breakdown: {} };
    }
  }

  // Entfernung berechnen (vereinfacht)
  static calculateDistance(location1: any, location2: any) {
    if (!location1 || !location2 || !location1.coordinates || !location2.coordinates) {
      return null;
    }

    const lat1 = location1.coordinates.lat;
    const lon1 = location1.coordinates.lng;
    const lat2 = location2.coordinates.lat;
    const lon2 = location2.coordinates.lng;

    const R = 6371; // Erdradius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance);
  }

  // Alter berechnen
  static calculateAge(dateOfBirth: Date | null): number | null {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Tage seit Datum berechnen
  static daysSince(date: Date | null) {
    if (!date) return 999;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Swipe-Statistiken aktualisieren
  static async updateSwipeStats(userId: string, action: string) {
    try {
      const stats = await db
        .select()
        .from(swipeStatsTable)
        .where(eq(swipeStatsTable.userId, userId))
        .limit(1);

      if (stats.length === 0) {
        // Neue Statistik erstellen
        const newStats: NewSwipeStats = {
          userId,
          totalSwipes: 1,
          totalLikes: action === 'like' || action === 'super_like' ? 1 : 0,
          totalSkips: action === 'skip' ? 1 : 0,
          totalMatches: 0,
          likesReceived: 0,
          skipsReceived: 0,
          matchesReceived: 0,
          averageMatchQuality: 0,
          lastSwipeAt: new Date(),
          swipeStreak: 1,
          bestMatchQuality: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.insert(swipeStatsTable).values(newStats);
      } else {
        // Bestehende Statistik aktualisieren
        const currentStats = stats[0];
        const updates: any = {
          totalSwipes: currentStats.totalSwipes + 1,
          lastSwipeAt: new Date(),
          swipeStreak: currentStats.swipeStreak + 1,
          updatedAt: new Date()
        };

        if (action === 'like' || action === 'super_like') {
          updates.totalLikes = currentStats.totalLikes + 1;
        } else if (action === 'skip') {
          updates.totalSkips = currentStats.totalSkips + 1;
        }

        await db
          .update(swipeStatsTable)
          .set(updates)
          .where(eq(swipeStatsTable.userId, userId));
      }

    } catch (error) {
      console.error('❌ SwipeService: Error updating swipe stats:', error);
    }
  }

  // Match-Statistiken aktualisieren
  static async updateMatchStats(userId: string) {
    try {
      await db
        .update(swipeStatsTable)
        .set({
          totalMatches: sql`${swipeStatsTable.totalMatches} + 1`,
          updatedAt: new Date()
        })
        .where(eq(swipeStatsTable.userId, userId));

    } catch (error) {
      console.error('❌ SwipeService: Error updating match stats:', error);
    }
  }

  // Match-Benachrichtigung senden
  static async sendMatchNotification(user1Id: string, user2Id: string, match: any) {
    try {
      // User-Profile für Benachrichtigung laden
      const user1Profile = await this.getUserProfile(user1Id);
      const user2Profile = await this.getUserProfile(user2Id);

      if (!user1Profile || !user2Profile) return;

      // WebSocket Service Instance holen
      const websocketService = getWebSocketService();
      
      if (!websocketService) {
        console.error('❌ SwipeService: WebSocket service not available');
        return;
      }

      // Benachrichtigung an beide User senden
      const notification = {
        type: 'match',
        title: 'Neues Match! 🎉',
        message: `Du hast ein Match mit ${user2Profile.displayName || user2Profile.username}!`,
        data: {
          matchId: match.id,
          otherUser: {
            id: user2Profile.id,
            username: user2Profile.username,
            displayName: user2Profile.displayName,
            avatarId: user2Profile.avatarId
          },
          match: {
            id: match.id,
            matchQuality: match.matchQuality,
            commonInterests: match.commonInterests,
            matchedAt: match.matchedAt
          }
        }
      };

      // WebSocket-Benachrichtigung senden
      websocketService.sendToUser(user1Id, 'match_notification', {
        ...notification,
        data: {
          ...notification.data,
          otherUser: {
            id: user2Profile.id,
            username: user2Profile.username,
            displayName: user2Profile.displayName,
            avatarId: user2Profile.avatarId
          }
        }
      });

      websocketService.sendToUser(user2Id, 'match_notification', {
        ...notification,
        data: {
          ...notification.data,
          otherUser: {
            id: user1Profile.id,
            username: user1Profile.username,
            displayName: user1Profile.displayName,
            avatarId: user1Profile.avatarId
          }
        }
      });

      console.log('✅ SwipeService: Match notifications sent');

    } catch (error) {
      console.error('❌ SwipeService: Error sending match notification:', error);
    }
  }

  // User-Matches laden
  static async getUserMatches(userId: string, limit: number = 50) {
    try {
      const matches = await db
        .select({
          id: matchesTable.id,
          user1Id: matchesTable.user1Id,
          user2Id: matchesTable.user2Id,
          matchedAt: matchesTable.matchedAt,
          isActive: matchesTable.isActive,
          matchQuality: matchesTable.matchQuality,
          commonInterests: matchesTable.commonInterests,
          lastInteraction: matchesTable.lastInteraction,
          status: matchesTable.status,
          // Other user data
          otherUsername: usersTable.username,
          otherDisplayName: usersTable.displayName,
          otherAvatarId: profilesTable.avatarId,
          otherBio: profilesTable.bio,
          otherLastActivity: usersTable.lastActivityAt,
        })
        .from(matchesTable)
        .leftJoin(usersTable, 
          sql`${usersTable.id} = CASE 
            WHEN ${matchesTable.user1Id} = ${userId} THEN ${matchesTable.user2Id}
            ELSE ${matchesTable.user1Id}
          END`
        )
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            or(
              eq(matchesTable.user1Id, userId),
              eq(matchesTable.user2Id, userId)
            ),
            eq(matchesTable.isActive, true),
            eq(matchesTable.status, 'active')
          )
        )
        .orderBy(desc(matchesTable.matchedAt))
        .limit(limit);

      return {
        success: true,
        data: {
          matches,
          total: matches.length
        }
      };

    } catch (error) {
      console.error('❌ SwipeService: Error getting user matches:', error);
      return { success: false, error: 'Failed to load matches' };
    }
  }

  // Swipe-Präferenzen aktualisieren
  static async updateSwipePreferences(userId: string, preferences: Partial<NewSwipePreferences>) {
    try {
      const existingPrefs = await this.getUserPreferences(userId);
      
      const updatedPrefs = {
        ...preferences,
        lastUpdated: new Date()
      };

      await db
        .update(swipePreferencesTable)
        .set(updatedPrefs)
        .where(eq(swipePreferencesTable.userId, userId));

      return {
        success: true,
        data: { ...existingPrefs, ...updatedPrefs }
      };

    } catch (error) {
      console.error('❌ SwipeService: Error updating swipe preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  // Swipe-Statistiken abrufen
  static async getSwipeStats(userId: string) {
    try {
      const stats = await db
        .select()
        .from(swipeStatsTable)
        .where(eq(swipeStatsTable.userId, userId))
        .limit(1);

      if (stats.length === 0) {
        return {
          success: true,
          data: {
            totalSwipes: 0,
            totalLikes: 0,
            totalSkips: 0,
            totalMatches: 0,
            swipeStreak: 0,
            averageMatchQuality: 0
          }
        };
      }

      return {
        success: true,
        data: stats[0]
      };

    } catch (error) {
      console.error('❌ SwipeService: Error getting swipe stats:', error);
      return { success: false, error: 'Failed to load stats' };
    }
  }

  // New service method to get pending likes
  static async getPendingLikes(userId: string) {
    try {
      // Get users who liked the current user but haven't been swiped on yet
      const pendingLikes = await db
        .select({
          id: swipeActionsTable.id,
          swiperId: swipeActionsTable.swiperId,
          action: swipeActionsTable.action,
          timestamp: swipeActionsTable.timestamp,
          // Join user data
          username: usersTable.username,
          displayName: usersTable.displayName,
          avatarId: profilesTable.avatarId,
        })
        .from(swipeActionsTable)
        .innerJoin(usersTable, eq(swipeActionsTable.swiperId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            eq(swipeActionsTable.targetId, userId),
            inArray(swipeActionsTable.action, ['like', 'super_like']),
            // Nicht bereits gematcht
            sql`NOT EXISTS (
              SELECT 1 FROM ${matchesTable}
              WHERE (
                (${matchesTable.user1Id} = ${userId} AND ${matchesTable.user2Id} = ${swipeActionsTable.swiperId})
                OR 
                (${matchesTable.user1Id} = ${swipeActionsTable.swiperId} AND ${matchesTable.user2Id} = ${userId})
              )
            )`,
            // Und keine Swipe-Aktion in die andere Richtung vorhanden
            sql`NOT EXISTS (
              SELECT 1 FROM ${swipeActionsTable} AS sa2
              WHERE sa2.swiperId = ${userId}
              AND sa2.targetId = ${swipeActionsTable.swiperId}
            )`
          )
        )
        .orderBy(desc(swipeActionsTable.timestamp))
        .limit(50);

      return pendingLikes;
    } catch (error) {
      console.error('❌ SwipeService: Error getting pending likes:', error);
      throw error;
    }
  }
}

export default SwipeService;