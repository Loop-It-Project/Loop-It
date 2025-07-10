import bcrypt from 'bcryptjs';
import { db } from '../db/connection';
import { 
  usersTable, 
  rolesTable,
  userRolesTable,
  profilesTable, 
  postsTable,
  postReactionsTable,
  universesTable,
  friendshipsTable,
  universeMembersTable
} from '../db/Schemas';
import { eq, and, desc, asc, count, sql, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  
  // User Profile abrufen (eigenes)
  static async getUserProfile(userId: string) {
    try {
      const [user] = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          username: usersTable.username,
          displayName: usersTable.displayName,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          createdAt: usersTable.createdAt,
          // Profile Daten
          bio: profilesTable.bio,
          website: profilesTable.website,
          socialLinks: profilesTable.socialLinks,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          avatarId: profilesTable.avatarId
        })
        .from(usersTable)
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // User's eigene Posts abrufen
  static async getUserPosts(userId: string, page: number = 1, limit: number = 20, sortBy: string = 'newest') {
    try {
      const offset = (page - 1) * limit;
      
      const posts = await db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          content: postsTable.content,
          contentType: postsTable.contentType,
          mediaIds: postsTable.mediaIds,
          hashtags: postsTable.hashtags,
          likeCount: postsTable.likeCount,
          commentCount: postsTable.commentCount,
          shareCount: postsTable.shareCount,
          createdAt: postsTable.createdAt,
          universe: {
            id: universesTable.id,
            name: universesTable.name,
            slug: universesTable.slug
          }
        })
        .from(postsTable)
        .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id))
        .where(
          and(
            eq(postsTable.authorId, userId),
            eq(postsTable.isDeleted, false)
          )
        )
        .orderBy(
          sortBy === 'newest' ? desc(postsTable.createdAt) :
          sortBy === 'oldest' ? asc(postsTable.createdAt) :
          sortBy === 'likes' ? desc(postsTable.likeCount) :
          desc(postsTable.createdAt)
        )
        .offset(offset)
        .limit(limit);

      return {
        posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };
    } catch (error) {
      console.error('Error getting user posts:', error);
      throw error;
    }
  }

  // Profile aktualisieren
  static async updateProfile(userId: string, updateData: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    website?: string | null;
    socialLinks?: object | null;
    interests?: string[];
    hobbies?: string[];
  }) {
    try {
      console.log('🔧 UserService.updateProfile called with:', {
        userId,
        updateData: {
          ...updateData,
          socialLinksType: typeof updateData.socialLinks,
          interestsLength: updateData.interests?.length,
          hobbiesLength: updateData.hobbies?.length
        }
      });
    
      // User-Daten aktualisieren (nur wenn Werte gesetzt sind)
      const userUpdateData: any = {};
      if (updateData.displayName !== undefined) userUpdateData.displayName = updateData.displayName;
      if (updateData.firstName !== undefined) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) userUpdateData.lastName = updateData.lastName;
    
      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date();
        
        console.log('📝 Updating users table with:', userUpdateData);
        
        await db
          .update(usersTable)
          .set(userUpdateData)
          .where(eq(usersTable.id, userId));
      }
    
      // Profile-Daten aktualisieren
      const profileData: any = {};
      if (updateData.bio !== undefined) profileData.bio = updateData.bio;
      if (updateData.website !== undefined) profileData.website = updateData.website;
      if (updateData.socialLinks !== undefined) profileData.socialLinks = updateData.socialLinks;
      if (updateData.interests !== undefined) profileData.interests = updateData.interests;
      if (updateData.hobbies !== undefined) profileData.hobbies = updateData.hobbies;
    
      if (Object.keys(profileData).length > 0) {
        profileData.updatedAt = new Date();
        
        console.log('📝 Updating profiles table with:', profileData);
      
        // Prüfe ob Profile existiert
        const [existingProfile] = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.userId, userId))
          .limit(1);
      
        if (existingProfile) {
          // Profile existiert - aktualisieren
          await db
            .update(profilesTable)
            .set(profileData)
            .where(eq(profilesTable.userId, userId));
          
          console.log('✅ Profile updated successfully');
        } else {
          // Profile existiert nicht - erstellen
          await db
            .insert(profilesTable)
            .values({
              userId,
              ...profileData,
              createdAt: new Date()
            });
          
          console.log('✅ Profile created successfully');
        }
      }
    
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }

  // User-Statistiken
  static async getUserStats(userId: string) {
    try {
      const [stats] = await db
        .select({
          totalPosts: sql<number>`COUNT(DISTINCT ${postsTable.id})`,
          totalLikes: sql<number>`SUM(${postsTable.likeCount})`,
          totalUniverses: sql<number>`COUNT(DISTINCT ${universeMembersTable.universeId})`,
          totalFriends: sql<number>`COUNT(DISTINCT ${friendshipsTable.id})`
        })
        .from(usersTable)
        .leftJoin(postsTable, 
          and(
            eq(postsTable.authorId, usersTable.id),
            eq(postsTable.isDeleted, false)
          )
        )
        .leftJoin(universeMembersTable, eq(universeMembersTable.userId, usersTable.id))
        .leftJoin(friendshipsTable, 
          and(
            eq(friendshipsTable.requesterId, usersTable.id),
            eq(friendshipsTable.status, 'accepted')
          )
        )
        .where(eq(usersTable.id, userId));

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Profile aktualisieren mit Social Links
  static async updateUserProfileExtended(userId: string, updateData: any) {
    try {
      const { 
        displayName, 
        firstName, 
        lastName, 
        bio, 
        website, 
        socialLinks, 
        interests, 
        hobbies 
      } = updateData;

      // User-Tabelle aktualisieren
      const userUpdateData: any = {};
      if (displayName !== undefined) userUpdateData.displayName = displayName;
      if (firstName !== undefined) userUpdateData.firstName = firstName;
      if (lastName !== undefined) userUpdateData.lastName = lastName;

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date();
        await db
          .update(usersTable)
          .set(userUpdateData)
          .where(eq(usersTable.id, userId));
      }

      // Profile-Tabelle aktualisieren
      const profileUpdateData: any = {};
      if (bio !== undefined) profileUpdateData.bio = bio;
      if (website !== undefined) profileUpdateData.website = website;
      if (socialLinks !== undefined) profileUpdateData.socialLinks = socialLinks;
      if (interests !== undefined) profileUpdateData.interests = interests;
      if (hobbies !== undefined) profileUpdateData.hobbies = hobbies;

      if (Object.keys(profileUpdateData).length > 0) {
        profileUpdateData.updatedAt = new Date();
        
        // Stelle sicher dass Profile existiert
        await this.ensureUserProfile(userId);
        
        await db
          .update(profilesTable)
          .set(profileUpdateData)
          .where(eq(profilesTable.userId, userId));
      }

      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Error updating extended user profile:', error);
      throw error;
    }
  }

  // Freunde mit gemeinsamen Interessen finden
  static async getFriendsWithCommonInterests(userId: string, limit: number = 10) {
    try {
      // Hole User's Interessen
      const [userProfile] = await db
        .select({ 
          interests: profilesTable.interests, 
          hobbies: profilesTable.hobbies 
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      if (!userProfile) return [];

      // Type Safety für Arrays
      const userInterests = Array.isArray(userProfile.interests) 
        ? userProfile.interests 
        : [];
      const userHobbies = Array.isArray(userProfile.hobbies) 
        ? userProfile.hobbies 
        : [];
      
      if (userInterests.length === 0 && userHobbies.length === 0) return [];

      // Finde Freunde
      const friends = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          bio: profilesTable.bio,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          avatarId: profilesTable.avatarId
        })
        .from(friendshipsTable)
        .innerJoin(usersTable, eq(friendshipsTable.addresseeId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            eq(friendshipsTable.requesterId, userId),
            eq(friendshipsTable.status, 'accepted')
          )
        )
        .limit(limit);

      // Filter für gemeinsame Interessen mit Type Safety
      return friends
        .filter(friend => {
          const friendInterests = Array.isArray(friend.interests) 
            ? friend.interests 
            : [];
          const friendHobbies = Array.isArray(friend.hobbies) 
            ? friend.hobbies 
            : [];

          const commonInterests = userInterests.filter((interest: string) => 
            friendInterests.includes(interest)
          );
          const commonHobbies = userHobbies.filter((hobby: string) => 
            friendHobbies.includes(hobby)
          );

          return commonInterests.length > 0 || commonHobbies.length > 0;
        })
        .map(friend => ({
          ...friend,
          commonInterests: userInterests.filter((interest: string) => {
            const friendInterests = Array.isArray(friend.interests) 
              ? friend.interests 
              : [];
            return friendInterests.includes(interest);
          }),
          commonHobbies: userHobbies.filter((hobby: string) => {
            const friendHobbies = Array.isArray(friend.hobbies) 
              ? friend.hobbies 
              : [];
            return friendHobbies.includes(hobby);
          })
        }));
    } catch (error) {
      console.error('Error getting friends with common interests:', error);
      return [];
    }
  }

  // PASSWORD ändern
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Aktuelles Password prüfen
      const user = await db
        .select({
          passwordHash: usersTable.passwordHash
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user[0].passwordHash);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Neues Password hashen
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Password aktualisieren
      await db
        .update(usersTable)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Public User Profile abrufen (für andere User)
  static async getPublicUserProfile(username: string) {
    try {
      const [user] = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          createdAt: usersTable.createdAt,
          // Profile Daten (öffentlich)
          bio: profilesTable.bio,
          website: profilesTable.website,
          socialLinks: profilesTable.socialLinks,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          avatarId: profilesTable.avatarId
        })
        .from(usersTable)
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(usersTable.username, username))
        .limit(1);

      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Error getting public user profile:', error);
      throw error;
    }
  }

  // USER SETTINGS abrufen
  static async getUserSettings(userId: string) {
    try {
      const settings = await db
        .select({
          emailNotifications: usersTable.emailNotifications,
          pushNotifications: usersTable.pushNotifications,
          locationVisibility: usersTable.locationVisibility,
          searchRadius: usersTable.searchRadius,
          premiumTier: usersTable.premiumTier,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (settings.length === 0) {
        throw new Error('User not found');
      }

      // Profile-Settings laden
      const profileSettings = await db
        .select({
          profileVisibility: profilesTable.profileVisibility,
          showAge: profilesTable.showAge,
          showLocation: profilesTable.showLocation,
          allowMessagesFrom: profilesTable.allowMessagesFrom,
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      return {
        ...settings[0],
        ...(profileSettings.length > 0 ? profileSettings[0] : {})
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // USER SETTINGS aktualisieren
  static async updateUserSettings(userId: string, updateData: any) {
    try {
      const { 
        emailNotifications, 
        pushNotifications, 
        locationVisibility, 
        searchRadius,
        profileVisibility,
        showAge,
        showLocation,
        allowMessagesFrom
      } = updateData;

      // User-Tabelle aktualisieren
      const userUpdateData: any = {};
      if (emailNotifications !== undefined) userUpdateData.emailNotifications = emailNotifications;
      if (pushNotifications !== undefined) userUpdateData.pushNotifications = pushNotifications;
      if (locationVisibility !== undefined) userUpdateData.locationVisibility = locationVisibility;
      if (searchRadius !== undefined) userUpdateData.searchRadius = searchRadius;

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date();
        await db
          .update(usersTable)
          .set(userUpdateData)
          .where(eq(usersTable.id, userId));
      }

      // Profile-Tabelle aktualisieren
      const profileUpdateData: any = {};
      if (profileVisibility !== undefined) profileUpdateData.profileVisibility = profileVisibility;
      if (showAge !== undefined) profileUpdateData.showAge = showAge;
      if (showLocation !== undefined) profileUpdateData.showLocation = showLocation;
      if (allowMessagesFrom !== undefined) profileUpdateData.allowMessagesFrom = allowMessagesFrom;

      if (Object.keys(profileUpdateData).length > 0) {
        profileUpdateData.updatedAt = new Date();
        
        // Prüfe ob Profile existiert, wenn nicht, erstelle es
        const existingProfile = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.userId, userId))
          .limit(1);

        if (existingProfile.length > 0) {
          await db
            .update(profilesTable)
            .set(profileUpdateData)
            .where(eq(profilesTable.userId, userId));
        } else {
          await db
            .insert(profilesTable)
            .values({
              userId,
              ...profileUpdateData,
              createdAt: new Date()
            });
        }
      }

      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Profile-Erstellung falls nicht vorhanden
  static async ensureUserProfile(userId: string) {
    try {
      const existingProfile = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        await db
          .insert(profilesTable)
          .values({
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      return true;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }

  // Geo-Tracking Settings abrufen
  static async getGeoTrackingSettings(userId: string) {
    try {
      const user = await db
        .select({
          geoTrackingEnabled: usersTable.geoTrackingEnabled,
          geoTrackingAccuracy: usersTable.geoTrackingAccuracy,
          autoUpdateLocation: usersTable.autoUpdateLocation,
          showDistanceToOthers: usersTable.showDistanceToOthers,
          searchRadius: usersTable.searchRadius,
          maxSearchRadius: usersTable.maxSearchRadius,
          locationVisibility: usersTable.locationVisibility,
          location: usersTable.location,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: user[0]
      };
    } catch (error) {
      console.error('❌ Error getting geo tracking settings:', error);
      return {
        success: false,
        error: 'Failed to get geo tracking settings'
      };
    }
  }

  // Geo-Tracking Settings aktualisieren
  static async updateGeoTrackingSettings(userId: string, settingsData: any) {
    try {
      const {
        geoTrackingEnabled,
        geoTrackingAccuracy,
        autoUpdateLocation,
        showDistanceToOthers,
        searchRadius,
        locationVisibility,
        location
      } = settingsData;

      const updateData: any = {};
      
      if (geoTrackingEnabled !== undefined) updateData.geoTrackingEnabled = geoTrackingEnabled;
      if (geoTrackingAccuracy !== undefined) updateData.geoTrackingAccuracy = geoTrackingAccuracy;
      if (autoUpdateLocation !== undefined) updateData.autoUpdateLocation = autoUpdateLocation;
      if (showDistanceToOthers !== undefined) updateData.showDistanceToOthers = showDistanceToOthers;
      if (searchRadius !== undefined) {
        // Validiere Radius (1-500 km)
        const radius = Math.max(1, Math.min(500, parseInt(searchRadius)));
        updateData.searchRadius = radius;
      }
      if (locationVisibility !== undefined) updateData.locationVisibility = locationVisibility;
      if (location !== undefined) updateData.location = location;

      updateData.updatedAt = new Date();

      await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, userId));

      return {
        success: true,
        message: 'Geo tracking settings updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating geo tracking settings:', error);
      return {
        success: false,
        error: 'Failed to update geo tracking settings'
      };
    }
  }

  // Standort aktualisieren
  static async updateUserLocation(userId: string, locationData: any) {
    try {
      const { latitude, longitude, accuracy, address } = locationData;

      // Validiere Koordinaten
      if (!latitude || !longitude || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        throw new Error('Invalid coordinates');
      }

      const locationJson = {
        coordinates: { lat: latitude, lng: longitude },
        accuracy: accuracy || 'unknown',
        address: address || null,
        isAccurate: accuracy && accuracy < 100, // Weniger als 100m = genau
        lastUpdated: new Date().toISOString()
      };

      await db
        .update(usersTable)
        .set({
          location: locationJson,
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      return {
        success: true,
        message: 'Location updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating user location:', error);
      return {
        success: false,
        error: 'Failed to update location'
      };
    }
  }

  // User-Rollen abrufen
  static async getUserRoles(userId: string) {
    try {
      const userRoles = await db
        .select({
          roleId: userRolesTable.roleId,
          roleName: rolesTable.name,
          roleDescription: rolesTable.description,
          permissions: rolesTable.permissions,
          isActive: userRolesTable.isActive,
          assignedAt: userRolesTable.assignedAt,
          expiresAt: userRolesTable.expiresAt
        })
        .from(userRolesTable)
        .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
        .where(
          and(
            eq(userRolesTable.userId, userId),
            eq(userRolesTable.isActive, true),
            eq(rolesTable.isActive, true),
            or(
              sql`${userRolesTable.expiresAt} IS NULL`,
              sql`${userRolesTable.expiresAt} > NOW()`
            )
          )
        );

      return userRoles;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  // Default User-Rolle zuweisen
  static async assignDefaultUserRole(userId: string) {
    try {
      // Prüfe ob User bereits eine Rolle hat
      const existingRoles = await db
        .select()
        .from(userRolesTable)
        .where(
          and(
            eq(userRolesTable.userId, userId),
            eq(userRolesTable.isActive, true)
          )
        );

      if (existingRoles.length > 0) {
        console.log('ℹ️ User already has roles assigned');
        return true;
      }

      // Hole die Standard "user" Rolle
      let userRole = await db
        .select()
        .from(rolesTable)
        .where(
          and(
            eq(rolesTable.name, 'user'),
            eq(rolesTable.isActive, true)
          )
        )
        .limit(1);

      // Erstelle die Rolle falls sie nicht existiert
      if (userRole.length === 0) {
        const createdRole = await db
          .insert(rolesTable)
          .values({
            name: 'user',
            description: 'Standard Benutzer',
            permissions: JSON.stringify([
              'read_posts', 
              'create_posts', 
              'join_universes', 
              'create_universes',
              'comment_posts',
              'react_posts',
              'send_messages',
              'update_profile'
            ]),
            isActive: true,
            isDefault: true
          })
          .returning();
        
        userRole = createdRole;
      }

      // Weise die Rolle zu
      await db
        .insert(userRolesTable)
        .values({
          userId,
          roleId: userRole[0].id,
          isActive: true,
          assignedBy: null, // System assignment
          assignedAt: new Date()
        });

      console.log('✅ Default user role assigned successfully');
      return true;

    } catch (error) {
      console.error('❌ Error assigning default user role:', error);
      return false;
    }
  }

  // Überprüfe ob User bestimmte Permission hat
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId);
      
      for (const role of userRoles) {
        let permissions: string[] = [];
        
        if (role.permissions) {
          if (Array.isArray(role.permissions)) {
            // Permissions ist bereits ein Array
            permissions = role.permissions;
          } else if (typeof role.permissions === 'string') {
            // Permissions ist ein JSON String
            try {
              permissions = JSON.parse(role.permissions);
            } catch (parseError) {
              console.error('Error parsing permissions JSON:', parseError);
              permissions = [];
            }
          } else if (typeof role.permissions === 'object') {
            // Permissions ist ein JSON Object (von Drizzle)
            permissions = Array.isArray(role.permissions) ? role.permissions : [];
          }
        }
        
        if (permissions.includes(permission)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}