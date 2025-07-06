import { db } from '../db';
import { 
  usersTable, 
  rolesTable, 
  moderationReportsTable, 
  universesTable,
  universeMembersTable,
  universeJoinRequestsTable,
  postsTable,
  userActivitiesTable
} from '../db/schema';
import { eq, and, or, like, desc, asc, count, sql, inArray } from 'drizzle-orm';

export class AdminService {
  
  // Admin Dashboard Metriken abrufen
  static async getDashboardMetrics() {
    try {
      const [
        totalUsers,
        totalUniverses,
        totalPosts,
        pendingReports,
        pendingUniverseApprovals,
        todayActivity
      ] = await Promise.all([
        // Gesamtanzahl User
        db.select({ count: count() }).from(usersTable)
          .where(eq(usersTable.accountStatus, 'active')),
        
        // Gesamtanzahl Universes
        db.select({ count: count() }).from(universesTable)
          .where(and(eq(universesTable.isActive, true), eq(universesTable.isDeleted, false))),
        
        // Gesamtanzahl Posts
        db.select({ count: count() }).from(postsTable)
          .where(eq(postsTable.isDeleted, false)),
        
        // Pending Reports
        db.select({ count: count() }).from(moderationReportsTable)
          .where(eq(moderationReportsTable.status, 'pending')),
        
        // Pending Universe Approvals (falls requireApproval = true)
        db.select({ count: count() }).from(universeJoinRequestsTable)
          .where(eq(universeJoinRequestsTable.status, 'pending')),
        
        // Heute's Aktivität
        db.select({ count: count() }).from(userActivitiesTable)
          .where(sql`DATE(${userActivitiesTable.createdAt}) = CURRENT_DATE`)
          .catch(() => [{ count: 0 }])
      ]);

      return {
        success: true,
        data: {
          users: {
            total: totalUsers[0]?.count || 0,
            newToday: 0, // TODO: Add date filter
            active: 0    // TODO: Add activity filter
          },
          universes: {
            total: totalUniverses[0]?.count || 0,
            pendingApproval: 0 // TODO: Add approval system
          },
          posts: {
            total: totalPosts[0]?.count || 0,
            today: 0 // TODO: Add date filter
          },
          moderation: {
            pendingReports: pendingReports[0]?.count || 0,
            pendingApprovals: pendingUniverseApprovals[0]?.count || 0
          },
          activity: {
            todayActions: todayActivity[0]?.count || 0
          }
        }
      };
    } catch (error) {
      console.error('❌ Error getting dashboard metrics:', error);
      return {
        success: false,
        error: 'Failed to get dashboard metrics'
      };
    }
  }

  // Alle User mit Rollen abrufen (für Admin-Verwaltung)
  static async getAllUsers(page = 1, limit = 50, search = '', role = '') {
    try {
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = [];
      
      if (search) {
        whereConditions.push(
          or(
            like(usersTable.username, `%${search}%`),
            like(usersTable.displayName, `%${search}%`),
            like(usersTable.email, `%${search}%`)
          )
        );
      }
      
      if (role) {
        // TODO: Add role filtering when user_roles table is implemented
      }
      
      const users = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          email: usersTable.email,
          accountStatus: usersTable.accountStatus,
          lastLoginAt: usersTable.lastLoginAt,
          createdAt: usersTable.createdAt,
          premiumTier: usersTable.premiumTier,
          // TODO: Add role information
        })
        .from(usersTable)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(usersTable.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(usersTable)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      return {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total: totalCount[0]?.count || 0,
            hasMore: users.length === limit
          }
        }
      };
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return {
        success: false,
        error: 'Failed to get users'
      };
    }
  }

  // Moderation Reports abrufen
  static async getModerationReports(page = 1, limit = 20, status = 'pending') {
    try {
      console.log('🔍 AdminService: Getting moderation reports (simplified)...');
      const offset = (page - 1) * limit;
      
      // Erst die Reports holen
      const reports = await db
        .select({
          id: moderationReportsTable.id,
          reporterId: moderationReportsTable.reporterId,
          reportedUserId: moderationReportsTable.reportedUserId,
          reportedContentType: moderationReportsTable.reportedContentType,
          reportedContentId: moderationReportsTable.reportedContentId,
          reason: moderationReportsTable.reason,
          description: moderationReportsTable.description,
          status: moderationReportsTable.status,
          createdAt: moderationReportsTable.createdAt,
        })
        .from(moderationReportsTable)
        .where(eq(moderationReportsTable.status, status))
        .orderBy(desc(moderationReportsTable.createdAt))
        .limit(limit)
        .offset(offset);

      // Dann die User-Daten separat laden (falls Reports existieren)
      type EnrichedReport = typeof reports[0] & {
        reporterUsername: string;
        reporterDisplayName: string;
        reportedUsername: string | null;
        reportedDisplayName: string | null;
      };

      let enrichedReports: EnrichedReport[] = [];
      
      if (reports.length > 0) {
        // Alle einzigartigen User-IDs sammeln
        const userIds = [...new Set([
          ...reports.map(r => r.reporterId),
          ...reports.filter(r => r.reportedUserId).map(r => r.reportedUserId!)
        ])];

        // User-Daten laden
        const users = await db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
          })
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));

        // User-Map erstellen
        const userMap = users.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {} as Record<string, typeof users[0]>);

        // Reports mit User-Daten anreichern
        enrichedReports = reports.map(report => ({
          ...report,
          reporterUsername: userMap[report.reporterId]?.username || 'Unknown',
          reporterDisplayName: userMap[report.reporterId]?.displayName || 'Unknown',
          reportedUsername: report.reportedUserId ? (userMap[report.reportedUserId]?.username || 'Unknown') : null,
          reportedDisplayName: report.reportedUserId ? (userMap[report.reportedUserId]?.displayName || 'Unknown') : null,
        })) as EnrichedReport[];
      }

      // console.log('✅ AdminService: Moderation reports retrieved:', enrichedReports.length);

      return {
        success: true,
        data: {
          reports: enrichedReports,
          pagination: {
            page,
            limit,
            hasMore: reports.length === limit
          }
        }
      };
    } catch (error) {
      console.error('❌ Error getting moderation reports:', error);
      return {
        success: false,
        error: 'Failed to get moderation reports'
      };
    }
  }

  // Universe Moderator zuweisen
  static async assignUniverseModerator(universeId: string, userId: string, adminId: string) {
    try {
      // Prüfe ob User bereits Mitglied ist
      const existingMember = await db
        .select()
        .from(universeMembersTable)
        .where(and(
          eq(universeMembersTable.universeId, universeId),
          eq(universeMembersTable.userId, userId)
        ))
        .limit(1);

      if (existingMember.length > 0) {
        // Update existing member to moderator
        await db
          .update(universeMembersTable)
          .set({
            role: 'moderator',
            updatedAt: new Date()
          })
          .where(and(
            eq(universeMembersTable.universeId, universeId),
            eq(universeMembersTable.userId, userId)
          ));
      } else {
        // Add as new moderator
        await db
          .insert(universeMembersTable)
          .values({
            universeId,
            userId,
            role: 'moderator',
            invitedBy: adminId,
            joinedAt: new Date(),
            notificationsEnabled: true
          });
      }

      // Log admin activity
      await db
        .insert(userActivitiesTable)
        .values({
          userId: adminId,
          activityType: 'admin_assign_moderator',
          entityType: 'universe',
          entityId: universeId,
          metadata: { assignedUserId: userId }
        });

      return {
        success: true,
        message: 'Moderator successfully assigned'
      };
    } catch (error) {
      console.error('❌ Error assigning universe moderator:', error);
      return {
        success: false,
        error: 'Failed to assign moderator'
      };
    }
  }

  // Pending Approvals abrufen
  static async getPendingApprovals() {
    try {
      // Universe Join Requests
      const universeApprovals = await db
        .select({
          id: universeJoinRequestsTable.id,
          type: sql<string>`'universe_join'`,
          universeId: universeJoinRequestsTable.universeId,
          userId: universeJoinRequestsTable.userId,
          message: universeJoinRequestsTable.message,
          requestedAt: universeJoinRequestsTable.requestedAt,
          // Universe info
          universeName: universesTable.name,
          universeSlug: universesTable.slug,
          // User info
          username: usersTable.username,
          displayName: usersTable.displayName
        })
        .from(universeJoinRequestsTable)
        .leftJoin(universesTable, eq(universeJoinRequestsTable.universeId, universesTable.id))
        .leftJoin(usersTable, eq(universeJoinRequestsTable.userId, usersTable.id))
        .where(eq(universeJoinRequestsTable.status, 'pending'))
        .orderBy(desc(universeJoinRequestsTable.requestedAt));

      // TODO: Add other approval types (universe creation, user verification, etc.)

      return {
        success: true,
        data: {
          universeJoinRequests: universeApprovals,
          // userVerifications: [],
          // universeCreations: []
        }
      };
    } catch (error) {
      console.error('❌ Error getting pending approvals:', error);
      return {
        success: false,
        error: 'Failed to get pending approvals'
      };
    }
  }

  // Check if user has admin permissions
  static async checkAdminPermissions(userId: string) {
    try {
      const user = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          username: usersTable.username,
          accountStatus: usersTable.accountStatus,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user.length === 0) {
        return { 
          success: false, 
          error: 'User not found',
          data: null
        };
      }

    //   console.log('🔍 AdminService: Found user:', {
    //     id: user[0].id,
    //     email: user[0].email,
    //     username: user[0].username,
    //     accountStatus: user[0].accountStatus
    //   });

      // Temporäre Admin-Liste (später durch DB-Rollen ersetzen)
      const adminEmails = [
        'admin@loop-it.com',
        'developer@loop-it.com',
        'test@admin.com',
        'zerrelius@gmail.com',
        'Zerrelius@gmail.com'
      ];

      const adminUsernames = [
        'admin',
        'developer',
        'testadmin',
        'zerrelius',
        'Zerrelius'
      ];

      // Case-Insensitive Vergleich
      const userEmail = user[0].email.toLowerCase();
      const userName = user[0].username.toLowerCase();
      
      const isEmailAdmin = adminEmails.some(email => email.toLowerCase() === userEmail);
      const isUsernameAdmin = adminUsernames.some(username => username.toLowerCase() === userName);
      const isStatusAdmin = user[0].accountStatus === 'admin';

    //   const isAdmin = adminEmails.includes(user[0].email) || 
    //                  adminUsernames.includes(user[0].username) ||
    //                  user[0].accountStatus === 'admin';

    // console.log('🔍 AdminService: Detailed admin check:', {
    //     userEmail: user[0].email,
    //     userEmailLower: userEmail,
    //     userName: user[0].username,
    //     userNameLower: userName,
    //     userStatus: user[0].accountStatus,
    //     isEmailAdmin,
    //     isUsernameAdmin, 
    //     isStatusAdmin,
    //     adminEmails,
    //     adminUsernames
    //   });

      const isAdmin = isEmailAdmin || isUsernameAdmin || isStatusAdmin;

    //   console.log('🔍 AdminService: Final admin result:', isAdmin);

      return {
        success: true,
        data: {
          isAdmin,
          permissions: isAdmin ? ['admin', 'moderator', 'user'] : ['user']
        }
      };
    } catch (error) {
      console.error('❌ Error checking admin permissions:', error);
      return {
        success: false,
        error: 'Failed to check permissions',
        data: null
      };
    }
  }
}