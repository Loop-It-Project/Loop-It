import { db } from '../db/connection';
import { 
  universesTable, 
  universeMembersTable, 
  universeJoinRequestsTable,
  usersTable,
  profilesTable,
  postsTable
} from '../db/Schemas';
import { eq, and, desc, sql, count, not } from 'drizzle-orm';

export interface CreateUniverseData {
  name: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  requireApproval?: boolean;
  allowImages?: boolean;
  allowPolls?: boolean;
  minAgeRequirement?: number;
  rules?: any[]; // Array of rule objects
}

export interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  coverImageId?: string;
  memberCount: number;
  postCount: number;
  isPublic: boolean;
  requireApproval: boolean;
  createdAt: Date;
  isMember?: boolean;
  membershipStatus?: 'member' | 'pending' | 'none';
}

export interface UniverseMember {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  role: string;
  joinedAt: Date;
  avatarId?: string;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UniverseListData {
  universes: any[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Slug Generation Function
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Entferne Sonderzeichen außer Bindestriche
    .replace(/\s+/g, '-')         // Leerzeichen zu Bindestrichen
    .replace(/-+/g, '-')          // Mehrfache Bindestriche zu einfachen
    .replace(/^-|-$/g, '');       // Bindestriche am Anfang/Ende entfernen
}

// Hashtag Generation Function  
function generateHashtag(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Entferne alle Sonderzeichen
    .replace(/\s+/g, '')          // Entferne alle Leerzeichen
    .substring(0, 50);            // Maximal 50 Zeichen
}

export class UniverseService {
  
  // Universe beitreten
  static async joinUniverse(userId: string, universeSlug: string) {
    try {
      // 1. Universe finden
      const universe = await db
        .select()
        .from(universesTable)
        .where(eq(universesTable.slug, universeSlug))
        .limit(1);

      if (universe.length === 0) {
        throw new Error('Universe not found');
      }

      const universeData = universe[0];

      // 2. Prüfen ob User bereits Mitglied ist
      const existingMembership = await db
        .select()
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.universeId, universeData.id),
            eq(universeMembersTable.userId, userId)
          )
        )
        .limit(1);

      if (existingMembership.length > 0) {
        throw new Error('Already a member of this universe');
      }

      // 3. Prüfen ob Approval erforderlich ist
      if (universeData.requireApproval) {
        // Join Request erstellen
        const existingRequest = await db
          .select()
          .from(universeJoinRequestsTable)
          .where(
            and(
              eq(universeJoinRequestsTable.universeId, universeData.id),
              eq(universeJoinRequestsTable.userId, userId),
              eq(universeJoinRequestsTable.status, 'pending')
            )
          )
          .limit(1);

        if (existingRequest.length > 0) {
          throw new Error('Join request already pending');
        }

        await db.insert(universeJoinRequestsTable).values({
          universeId: universeData.id,
          userId,
          status: 'pending'
        });

        return { status: 'pending', message: 'Join request submitted for approval' };
      } else {
        // Direkter Beitritt
        await db.insert(universeMembersTable).values({
          universeId: universeData.id,
          userId,
          role: 'member'
        });

        // Member Count erhöhen
        await db
          .update(universesTable)
          .set({ 
            memberCount: sql`${universesTable.memberCount} + 1`
          })
          .where(eq(universesTable.id, universeData.id));

        return { status: 'joined', message: 'Successfully joined universe' };
      }
    } catch (error) {
      console.error('Error joining universe:', error);
      throw error;
    }
  }

  // Universe verlassen
  static async leaveUniverse(userId: string, universeSlug: string) {
    try {
      // Universe finden und Membership prüfen
      const result = await db
        .select({
          universeId: universesTable.id,
          membershipId: universeMembersTable.id,
          role: universeMembersTable.role
        })
        .from(universesTable)
        .innerJoin(universeMembersTable, eq(universesTable.id, universeMembersTable.universeId))
        .where(
          and(
            eq(universesTable.slug, universeSlug),
            eq(universeMembersTable.userId, userId)
          )
        )
        .limit(1);

      if (result.length === 0) {
        throw new Error('Not a member of this universe');
      }

      const { universeId, membershipId, role } = result[0];

      // Creator kann nicht verlassen (außer er überträgt ownership)
      if (role === 'creator') {
        throw new Error('Universe creator cannot leave. Please transfer ownership first or delete the universe.');
      }

      // Membership entfernen
      await db
        .delete(universeMembersTable)
        .where(eq(universeMembersTable.id, membershipId));

      // Member Count reduzieren
      await db
        .update(universesTable)
        .set({ 
          memberCount: sql`${universesTable.memberCount} - 1`
        })
        .where(eq(universesTable.id, universeId));

      return { status: 'left', message: 'Successfully left universe' };
    } catch (error) {
      console.error('Error leaving universe:', error);
      throw error;
    }
  }

  // User's Universes abrufen
  static async getUserUniverses(userId: string, page = 1, limit = 20): Promise<ServiceResponse<UniverseListData>> {
    const offset = (page - 1) * limit;

    try {
      const universes = await db
        .select({
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug,
          description: universesTable.description,
          category: universesTable.category,
          coverImageId: universesTable.coverImageId,
          memberCount: universesTable.memberCount,
          postCount: universesTable.postCount,
          isPublic: universesTable.isPublic,
          requireApproval: universesTable.requireApproval,
          createdAt: universesTable.createdAt,
          createdBy: universesTable.creatorId,
          role: universeMembersTable.role,
          joinedAt: universeMembersTable.joinedAt
        })
        .from(universeMembersTable)
        .innerJoin(universesTable, eq(universeMembersTable.universeId, universesTable.id))
        .where(
          and(
            eq(universeMembersTable.userId, userId),
            eq(universesTable.isDeleted, false)
          )
        )
        .orderBy(desc(universeMembersTable.joinedAt))
        .limit(limit)
        .offset(offset);

      // Total Count für Pagination
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(universeMembersTable)
        .innerJoin(universesTable, eq(universeMembersTable.universeId, universesTable.id))
        .where(
          and(
            eq(universeMembersTable.userId, userId),
            eq(universesTable.isDeleted, false)
          )
        );
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      // Format für Frontend anpassen
      const formattedUniverses = universes.map(universe => ({
        ...universe,
        isOwner: universe.createdBy === userId,
        isMember: true,
        membershipStatus: universe.role || 'member'
      }));

      // console.log('✅ getUserUniverses result:', {
      //   universeCount: formattedUniverses.length,
      //   totalCount,
      //   sampleUniverse: formattedUniverses[0] || null
      // });

      return {
        success: true,
        data: {
          universes: formattedUniverses,
          totalCount,
          page,
          limit,
          hasMore: offset + universes.length < totalCount
        }
      };

    } catch (error) {
      console.error('💥 UniverseService.getUserUniverses error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user universes'
      };
    }
  }

  // Universe Details mit echten Daten
  static async getUniverseDetails(universeSlug: string, userId?: string) {
    try {
      const universeQuery = db
        .select({
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug,
          description: universesTable.description,
          category: universesTable.category,
          coverImageId: universesTable.coverImageId,
          bannerImageId: universesTable.bannerImageId,
          memberCount: universesTable.memberCount,
          postCount: universesTable.postCount,
          isPublic: universesTable.isPublic,
          requireApproval: universesTable.requireApproval,
          createdAt: universesTable.createdAt,
          creatorId: universesTable.creatorId,
          isActive: universesTable.isActive,
          isDeleted: universesTable.isDeleted
        })
        .from(universesTable)
        .where(
          and(
            eq(universesTable.slug, universeSlug),
            eq(universesTable.isActive, true),
            eq(universesTable.isDeleted, false)
          )
        )
        .limit(1);
      
      const universe = await universeQuery;
      
      if (universe.length === 0) {
        throw new Error('Universe not found or deleted');
      }
    
      const universeData = universe[0];

      // Echte Mitglieder- und Post-Anzahlen berechnen
      const [memberCount, postCount] = await Promise.all([
        this.getActualMemberCount(universeData.id),
        this.getActualPostCount(universeData.id)
      ]);

      // Mit aktuellen Zahlen überschreiben
      universeData.memberCount = memberCount;
      universeData.postCount = postCount;

      let membershipStatus = 'none';
      let userRole = null;
    
      // Membership Status prüfen wenn User eingeloggt
      if (userId) {
        const membership = await db
          .select({
            role: universeMembersTable.role,
            joinedAt: universeMembersTable.joinedAt
          })
          .from(universeMembersTable)
          .where(
            and(
              eq(universeMembersTable.universeId, universeData.id),
              eq(universeMembersTable.userId, userId)
            )
          )
          .limit(1);
        
        if (membership.length > 0) {
          membershipStatus = 'member';
          userRole = membership[0].role;
        }
      }
    
      return {
        ...universeData,
        membershipStatus,
        userRole,
        isMember: membershipStatus === 'member'
      };
    } catch (error) {
      console.error('Error fetching universe details:', error);
      throw error;
    }
  }

  // Helper-Methoden
  static async getActualMemberCount(universeId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(universeMembersTable)
      .where(eq(universeMembersTable.universeId, universeId));
    return result[0]?.count || 0;
  }

  static async getActualPostCount(universeId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.universeId, universeId),
          eq(postsTable.isDeleted, false)
        )
      );
    return result[0]?.count || 0;
  }

  // Universe Members abrufen
  static async getUniverseMembers(universeSlug: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    try {
      const members = await db
        .select({
          id: universeMembersTable.id,
          userId: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          role: universeMembersTable.role,
          joinedAt: universeMembersTable.joinedAt,
          avatarId: profilesTable.avatarId
        })
        .from(universeMembersTable)
        .innerJoin(universesTable, eq(universeMembersTable.universeId, universesTable.id))
        .innerJoin(usersTable, eq(universeMembersTable.userId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(universesTable.slug, universeSlug))
        .orderBy(desc(universeMembersTable.joinedAt))
        .limit(limit)
        .offset(offset);

      return {
        members,
        pagination: {
          page,
          limit,
          hasMore: members.length === limit
        }
      };
    } catch (error) {
      console.error('Error fetching universe members:', error);
      throw new Error('Failed to fetch universe members');
    }
  }

    // Discover Universes (für User die neue Universes finden wollen)
  static async discoverUniverses(userId?: string, category?: string, page = 1, limit = 20, sortBy = 'popular') {
    const offset = (page - 1) * limit;

    try {
      // Basis-Bedingungen
      let whereConditions = and(
        eq(universesTable.isPublic, true),
        eq(universesTable.isActive, true),
        eq(universesTable.isDeleted, false)
      );

      // Kategorie-Filter hinzufügen falls vorhanden
      if (category) {
        whereConditions = and(whereConditions, eq(universesTable.category, category));
      }

      // Query mit kombinierten Bedingungen
      const query = db
        .select({
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug,
          description: universesTable.description,
          category: universesTable.category,
          coverImageId: universesTable.coverImageId,
          memberCount: universesTable.memberCount,
          postCount: universesTable.postCount,
          isPublic: universesTable.isPublic,
          requireApproval: universesTable.requireApproval,
          createdAt: universesTable.createdAt,
          creatorId: universesTable.creatorId
        })
        .from(universesTable)
        .where(whereConditions);

      // Sort based on parameter
      switch (sortBy) {
        case 'newest':
          query.orderBy(desc(universesTable.createdAt));
          break;
        case 'active': 
          query.orderBy(desc(universesTable.postCount));
          break;
        case 'popular':
        default:
          query.orderBy(desc(universesTable.memberCount));
          break;
      }

      const universes = await query
        .limit(limit)
        .offset(offset);

      // Zusätzlich - für jedes Universe die Counter aktualisieren
      for (const universe of universes) {
        const [memberCount, postCount] = await Promise.all([
          this.getActualMemberCount(universe.id),
          this.getActualPostCount(universe.id)
        ]);

        // Mit aktuellen Zahlen überschreiben
        universe.memberCount = memberCount;
        universe.postCount = postCount;

        // Optional: Werte in Datenbank aktualisieren
        if (memberCount !== universe.memberCount || postCount !== universe.postCount) {
          await db.update(universesTable)
            .set({ memberCount, postCount })
            .where(eq(universesTable.id, universe.id));
        }
      }

      // Get total count
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(universesTable)
        .where(whereConditions);

      const totalCount = totalCountResult[0]?.count || 0;

      // Check membership status if user is logged in
      let memberships: { universeId: string }[] = [];
      if (userId) {
        memberships = await db
          .select({
            universeId: universeMembersTable.universeId
          })
          .from(universeMembersTable)
          .where(eq(universeMembersTable.userId, userId));
      }

      const membershipMap = new Map(memberships.map(m => [m.universeId, true]));

      // Add membership AND ownership info to results
      const universesWithMembership = universes.map(universe => {
        const isOwner = universe.creatorId === userId;
        const isMember = membershipMap.has(universe.id);

        // Debug-Log hinzufügen
        // console.log('🔍 Backend Debug:', {
        //   slug: universe.slug,
        //   creatorId: universe.creatorId,
        //   userId: userId,
        //   isOwner: isOwner,
        //   isMember: isMember,
        //   membershipMapHas: membershipMap.has(universe.id)
        // });
      
        return {
          ...universe,
          isMember: isMember,
          isOwner: isOwner
        };
      });

      return {
        success: true,
        data: {
          universes: universesWithMembership,
          totalCount: universes.length,
          page,
          limit,
          hasMore: offset + universes.length < totalCount
        }
      };
    } catch (error) {
      console.error('Error discovering universes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to discover universes'
      };
    }
  }

    // Universe erstellen
    static async createUniverse(userId: string, universeData: CreateUniverseData) {
      try {
        // 1. Slug generieren und Eindeutigkeit prüfen
        let baseSlug = generateSlug(universeData.name);
        let slug = baseSlug;
        let slugCounter = 1;

        // Prüfen ob Slug bereits existiert
        while (true) {
          const existingSlug = await db
            .select()
            .from(universesTable)
            .where(eq(universesTable.slug, slug))
            .limit(1);

          if (existingSlug.length === 0) break; // Slug ist verfügbar
        
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // 2. Hashtag generieren und Eindeutigkeit prüfen
        let baseHashtag = generateHashtag(universeData.name);
        let hashtag = baseHashtag;
        let hashtagCounter = 1;

        // Prüfen ob Hashtag bereits existiert (falls hashtag Feld existiert)
        while (true) {
          const existingHashtag = await db
            .select()
            .from(universesTable)
            .where(eq(universesTable.hashtag, hashtag))
            .limit(1);

          if (existingHashtag.length === 0) break; // Hashtag ist verfügbar
        
          hashtag = `${baseHashtag}${hashtagCounter}`;
          hashtagCounter++;
        }

        // 3. Universe erstellen
        const newUniverse = await db.insert(universesTable).values({
          name: universeData.name.trim(),
          slug: slug,
          hashtag: hashtag,
          description: universeData.description?.trim() || null,
          category: universeData.category || null,
          creatorId: userId,
        
          // Einstellungen mit Defaults
          isPublic: universeData.isPublic ?? true,
          requireApproval: universeData.requireApproval ?? false,
          allowImages: universeData.allowImages ?? true,
          allowPolls: universeData.allowPolls ?? true,
          minAgeRequirement: universeData.minAgeRequirement || null,
        
          // Initiale Werte
          memberCount: 1, // Creator ist automatisch Mitglied
          postCount: 0,
          dailyActiveUsers: 1,
        
          // Status
          isActive: true,
          isVerified: false,
          isFeatured: false,
        
          // Rules falls vorhanden
          rules: universeData.rules ? JSON.stringify(universeData.rules) : null,
        }).returning();

        if (newUniverse.length === 0) {
          throw new Error('Failed to create universe');
        }

        const createdUniverse = newUniverse[0];

        // 4. Creator als ersten Member hinzufügen
        await db.insert(universeMembersTable).values({
          universeId: createdUniverse.id,
          userId: userId,
          role: 'creator', // Creator Rolle
          joinedAt: new Date(),
          notificationsEnabled: true,
        });

        // 5. Vollständige Universe-Daten zurückgeben
        return {
          id: createdUniverse.id,
          name: createdUniverse.name,
          slug: createdUniverse.slug,
          hashtag: createdUniverse.hashtag,
          description: createdUniverse.description,
          category: createdUniverse.category,
          memberCount: createdUniverse.memberCount,
          postCount: createdUniverse.postCount,
          isPublic: createdUniverse.isPublic,
          requireApproval: createdUniverse.requireApproval,
          createdAt: createdUniverse.createdAt,
          membershipStatus: 'member',
          userRole: 'creator',
          isMember: true
        };

      } catch (error) {
        console.error('Error creating universe:', error);
        throw error;
      }
    }

    // User's eigene Universes (erstellt) abrufen
    static async getOwnedUniverses(userId: string, page = 1, limit = 20): Promise<ServiceResponse<UniverseListData>> {
    const offset = (page - 1) * limit;
      
    try {
      const universes = await db
        .select({
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug,
          description: universesTable.description,
          category: universesTable.category,
          memberCount: universesTable.memberCount,
          postCount: universesTable.postCount,
          isPublic: universesTable.isPublic,
          createdAt: universesTable.createdAt,
          createdBy: universesTable.creatorId
        })
        .from(universesTable)
        .where(
          and(
            eq(universesTable.creatorId, userId),
            eq(universesTable.isActive, true),
            eq(universesTable.isDeleted, false)
          )
        )
        .orderBy(desc(universesTable.createdAt))
        .limit(limit)
        .offset(offset);

      // Total Count
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(universesTable)
        .where(
          and(
            eq(universesTable.creatorId, userId),
            eq(universesTable.isActive, true),
            eq(universesTable.isDeleted, false)
          )
        );

      const totalCount = totalCountResult[0]?.count || 0;

      // Format für Frontend anpassen
      const formattedUniverses = universes.map(universe => ({
        ...universe,
        isOwner: true,
        isMember: true,
        membershipStatus: 'owner'
      }));

      // console.log('✅ getOwnedUniverses result:', {
      //   universeCount: formattedUniverses.length,
      //   totalCount
      // });

      return {
        success: true,
        data: {
          universes: formattedUniverses,
          totalCount,
          page,
          limit,
          hasMore: offset + universes.length < totalCount
        }
      };
    } catch (error) {
      console.error('💥 UniverseService.getOwnedUniverses error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch owned universes'
      };
    }
  }

    // Name-Eindeutigkeit prüfen
    static async checkUniverseNameExists(name: string, excludeId?: string): Promise<boolean> {
      try {
        if (excludeId) {
          const existing = await db
            .select()
            .from(universesTable)
            .where(
              and(
                eq(universesTable.name, name.trim()),
                not(eq(universesTable.id, excludeId)),
                eq(universesTable.isDeleted, false) // ✅ Nur aktive Universes prüfen
              )
            )
            .limit(1);
          
          return existing.length > 0;
        } else {
          const existing = await db
            .select()
            .from(universesTable)
            .where(
              and(
                eq(universesTable.name, name.trim()),
                eq(universesTable.isDeleted, false) // ✅ Nur aktive Universes prüfen
              )
            )
            .limit(1);
          
          return existing.length > 0;
        }
      } catch (error) {
        console.error('Error checking universe name:', error);
        return false;
      }
    }

    // Universe löschen (Soft Delete)
    static async deleteUniverse(userId: string, universeSlug: string) {
      try {
        // Universe finden und Berechtigung prüfen
        const universe = await db
          .select({
            id: universesTable.id,
            name: universesTable.name,
            creatorId: universesTable.creatorId
          })
          .from(universesTable)
          .where(eq(universesTable.slug, universeSlug))
          .limit(1);
        
        if (universe.length === 0) {
          throw new Error('Universe not found');
        }
      
        if (universe[0].creatorId !== userId) {
          throw new Error('Only the creator can delete this universe');
        }
      
        // Soft Delete - Name wird durch isDeleted wieder frei
        await db
          .update(universesTable)
          .set({
            isActive: false,
            isDeleted: true,
            updatedAt: new Date()
          })
          .where(eq(universesTable.id, universe[0].id));
        
        return {
          success: true,
          message: 'Universe successfully deleted'
        };
      } catch (error) {
        console.error('Error deleting universe:', error);
        throw error;
      }
    }

    // Eigentümerschaft übertragen
    static async transferOwnership(userId: string, universeSlug: string, newOwnerId: string) {
      try {
        // Universe und aktuelle Berechtigung prüfen
        const universe = await db
          .select({
            id: universesTable.id,
            name: universesTable.name,
            creatorId: universesTable.creatorId
          })
          .from(universesTable)
          .where(eq(universesTable.slug, universeSlug))
          .limit(1);
        
        if (universe.length === 0) {
          throw new Error('Universe not found');
        }
      
        if (universe[0].creatorId !== userId) {
          throw new Error('Only the creator can transfer ownership');
        }
      
        // Prüfen ob neuer Owner Mitglied ist
        const newOwnerMembership = await db
          .select()
          .from(universeMembersTable)
          .where(
            and(
              eq(universeMembersTable.universeId, universe[0].id),
              eq(universeMembersTable.userId, newOwnerId)
            )
          )
          .limit(1);
        
        if (newOwnerMembership.length === 0) {
          throw new Error('New owner must be a member of the universe');
        }
      
        // Transaction für Ownership-Transfer
        await db.transaction(async (tx) => {
          // 1. Universe creatorId ändern
          await tx
            .update(universesTable)
            .set({
              creatorId: newOwnerId,
              updatedAt: new Date()
            })
            .where(eq(universesTable.id, universe[0].id));
          
          // 2. Alte Creator-Rolle zu 'member' ändern
          await tx
            .update(universeMembersTable)
            .set({
              role: 'member',
              updatedAt: new Date()
            })
            .where(
              and(
                eq(universeMembersTable.universeId, universe[0].id),
                eq(universeMembersTable.userId, userId)
              )
            );
          
          // 3. Neue Creator-Rolle setzen
          await tx
            .update(universeMembersTable)
            .set({
              role: 'creator',
              updatedAt: new Date()
            })
            .where(
              and(
                eq(universeMembersTable.universeId, universe[0].id),
                eq(universeMembersTable.userId, newOwnerId)
              )
            );
        });
      
        return {
          success: true,
          message: 'Ownership successfully transferred'
        };
      } catch (error) {
        console.error('Error transferring ownership:', error);
        throw error;
      }
    }

    // Methode zum Neuberechnen des Post-Counters eines Universe
  static async recalculateUniversePostCount(universeId: string) {
    try {
      // Anzahl der Posts für dieses Universe zählen
      const postCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(postsTable)
        .where(
          and(
            eq(postsTable.universeId, universeId),
            eq(postsTable.isDeleted, false)
          )
        );
      
      // Universe-Counter aktualisieren
      await db.update(universesTable)
        .set({ 
          postCount: postCount[0].count || 0 
        })
        .where(eq(universesTable.id, universeId));
      
      return { success: true };
    } catch (error) {
      console.error('Error recalculating universe post count:', error);
      return { success: false, error: 'Failed to recalculate post count' };
    }
  }

  // Methode zum Neuberechnen der Mitgliederanzahl eines Universe
  static async recalculateUniverseMemberCount(universeId: string) {
    try {
      // Anzahl der Mitglieder für dieses Universe zählen
      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(universeMembersTable)
        .where(eq(universeMembersTable.universeId, universeId));

      // Universe-Counter aktualisieren
      await db.update(universesTable)
        .set({ 
          memberCount: memberCount[0].count || 0 
        })
        .where(eq(universesTable.id, universeId));
      
      return { success: true };
    } catch (error) {
      console.error('Error recalculating universe member count:', error);
      return { success: false, error: 'Failed to recalculate member count' };
    }
  }
}