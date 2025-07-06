import { db } from '../db';
import { 
  usersTable, 
  rolesTable, 
  userRolesTable,
  moderationReportsTable, 
  universesTable,
  universeMembersTable,
  universeJoinRequestsTable,
  postsTable,
  userActivitiesTable
} from '../db/schema';
import { eq, and, or, like, desc, asc, count, sql, inArray, gte } from 'drizzle-orm';

export class AdminService {
  
  // Admin Dashboard Metriken abrufen
  static async getDashboardMetrics() {
    try {
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        totalUniverses,
        pendingUniverseApprovals,
        totalPosts,
        postsToday,
        pendingReports,
        pendingUniverseJoinRequests,
        todayActivity
      ] = await Promise.all([
        // Gesamtanzahl aktive User
        db.select({ count: count() }).from(usersTable)
          .where(eq(usersTable.accountStatus, 'active')),
        
        // Aktive User (die sich in den letzten 30 Tagen eingeloggt haben)
        db.select({ count: count() }).from(usersTable)
          .where(
            and(
              eq(usersTable.accountStatus, 'active'),
              gte(usersTable.lastLoginAt, sql`CURRENT_DATE - INTERVAL '30 days'`)
            )
          ),

        // Neue User heute
        db.select({ count: count() }).from(usersTable)
          .where(
            and(
              eq(usersTable.accountStatus, 'active'),
              gte(usersTable.createdAt, sql`CURRENT_DATE`)
            )
          ),
        
        // Gesamtanzahl Universes
        db.select({ count: count() }).from(universesTable)
          .where(and(eq(universesTable.isActive, true), eq(universesTable.isDeleted, false))),

        // Pending Universe Approvals
        db.select({ count: count() }).from(universesTable)
          .where(
            and(
              eq(universesTable.isActive, false),
              eq(universesTable.isDeleted, false)
            )
          ),
        
        // Gesamtanzahl Posts
        db.select({ count: count() }).from(postsTable)
          .where(eq(postsTable.isDeleted, false)),

        // Posts heute erstellt
        db.select({ count: count() }).from(postsTable)
          .where(
            and(
              eq(postsTable.isDeleted, false),
              gte(postsTable.createdAt, sql`CURRENT_DATE`)
            )
          ),
        
        // Pending Reports
        db.select({ count: count() }).from(moderationReportsTable)
          .where(eq(moderationReportsTable.status, 'pending'))
          .catch(() => [{ count: 0 }]),
        
        // Pending Universe Join Requests
        db.select({ count: count() }).from(universeJoinRequestsTable)
          .where(eq(universeJoinRequestsTable.status, 'pending'))
          .catch(() => [{ count: 0 }]),
        
        // Heute's Aktivität
        db.select({ count: count() }).from(userActivitiesTable)
          .where(gte(userActivitiesTable.createdAt, sql`CURRENT_DATE`))
          .catch(() => [{ count: 0 }])
      ]);

      const metrics = {
        users: {
          total: totalUsers[0]?.count || 0,
          newToday: newUsersToday[0]?.count || 0,
          active: activeUsers[0]?.count || 0,
          activePercentage: totalUsers[0]?.count > 0 
            ? Math.round((activeUsers[0]?.count / totalUsers[0]?.count) * 100) 
            : 0,
          newTodayPercentage: totalUsers[0]?.count > 0 
            ? Math.round((newUsersToday[0]?.count / totalUsers[0]?.count) * 100) 
            : 0
        },
        universes: {
          total: totalUniverses[0]?.count || 0,
          pendingApproval: pendingUniverseApprovals[0]?.count || 0
        },
        posts: {
          total: totalPosts[0]?.count || 0,
          today: postsToday[0]?.count || 0
        },
        moderation: {
          pendingReports: pendingReports[0]?.count || 0,
          pendingApprovals: pendingUniverseJoinRequests[0]?.count || 0
        },
        activity: {
          todayActions: todayActivity[0]?.count || 0,
          averagePostsPerUser: totalUsers[0]?.count > 0 
            ? Math.round((totalPosts[0]?.count / totalUsers[0]?.count) * 100) / 100
            : 0
        },
        systemHealth: {
          userEngagement: activeUsers[0]?.count > 0 && totalUsers[0]?.count > 0
            ? Math.round((activeUsers[0]?.count / totalUsers[0]?.count) * 100)
            : 0,
          contentGrowth: postsToday[0]?.count || 0,
          moderationLoad: (pendingReports[0]?.count || 0) + (pendingUniverseJoinRequests[0]?.count || 0)
        },
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error('❌ Error getting dashboard metrics:', error);
      return {
        success: false,
        error: 'Failed to get dashboard metrics'
      };
    }
  }

  // getAllUsers
  static async getAllUsers(page = 1, limit = 50, search = '', role = '') {
    try {
      const offset = (page - 1) * limit;
      
      // Basis Query ohne Where-Conditions
      let users;
      let totalCount;

      if (search) {
        // Query MIT Search
        users = await db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            email: usersTable.email,
            accountStatus: usersTable.accountStatus,
            lastLoginAt: usersTable.lastLoginAt,
            createdAt: usersTable.createdAt,
            premiumTier: usersTable.premiumTier,
          })
          .from(usersTable)
          .where(
            or(
              like(usersTable.username, `%${search}%`),
              like(usersTable.displayName, `%${search}%`),
              like(usersTable.email, `%${search}%`)
            )
          )
          .orderBy(desc(usersTable.createdAt))
          .limit(limit)
          .offset(offset);

        // Total count MIT Search
        const totalCountResult = await db
          .select({ count: count() })
          .from(usersTable)
          .where(
            or(
              like(usersTable.username, `%${search}%`),
              like(usersTable.displayName, `%${search}%`),
              like(usersTable.email, `%${search}%`)
            )
          );
        totalCount = totalCountResult[0]?.count || 0;
      } else {
        // Query OHNE Search
        users = await db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            email: usersTable.email,
            accountStatus: usersTable.accountStatus,
            lastLoginAt: usersTable.lastLoginAt,
            createdAt: usersTable.createdAt,
            premiumTier: usersTable.premiumTier,
          })
          .from(usersTable)
          .orderBy(desc(usersTable.createdAt))
          .limit(limit)
          .offset(offset);

        // Total count OHNE Search
        const totalCountResult = await db
          .select({ count: count() })
          .from(usersTable);
        totalCount = totalCountResult[0]?.count || 0;
      }

      // Rollen separat laden für jeden User
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          try {
            const userRoles = await db
              .select({ roleName: rolesTable.name })
              .from(userRolesTable)
              .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
              .where(
                and(
                  eq(userRolesTable.userId, user.id),
                  eq(userRolesTable.isActive, true),
                  eq(rolesTable.isActive, true)
                )
              );

            return {
              ...user,
              roles: userRoles.map(r => r.roleName)
            };
          } catch (error) {
            return { ...user, roles: [] };
          }
        })
      );

      // Role-Filtering nach Query
      let filteredUsers = usersWithRoles;
      if (role) {
        filteredUsers = usersWithRoles.filter(user => 
          user.roles.includes(role)
        );
      }

      return {
        success: true,
        data: {
          users: filteredUsers,
          pagination: {
            page,
            limit,
            total: totalCount,
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
      const offset = (page - 1) * limit;
      
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

      type EnrichedReport = typeof reports[0] & {
        reporterUsername: string;
        reporterDisplayName: string;
        reportedUsername: string | null;
        reportedDisplayName: string | null;
      };

      let enrichedReports: EnrichedReport[] = [];
      
      if (reports.length > 0) {
        const userIds = [...new Set([
          ...reports.map(r => r.reporterId),
          ...reports.filter(r => r.reportedUserId).map(r => r.reportedUserId!)
        ])];

        const users = await db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
          })
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));

        const userMap = users.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {} as Record<string, typeof users[0]>);

        enrichedReports = reports.map(report => ({
          ...report,
          reporterUsername: userMap[report.reporterId]?.username || 'Unknown',
          reporterDisplayName: userMap[report.reporterId]?.displayName || 'Unknown',
          reportedUsername: report.reportedUserId ? (userMap[report.reportedUserId]?.username || 'Unknown') : null,
          reportedDisplayName: report.reportedUserId ? (userMap[report.reportedUserId]?.displayName || 'Unknown') : null,
        })) as EnrichedReport[];
      }

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
      const existingMember = await db
        .select()
        .from(universeMembersTable)
        .where(and(
          eq(universeMembersTable.universeId, universeId),
          eq(universeMembersTable.userId, userId)
        ))
        .limit(1);

      if (existingMember.length > 0) {
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
      const [universeJoinRequests, universeCreations, userVerifications] = await Promise.all([
        // Universe Join Requests
        db.select({
          id: universeJoinRequestsTable.id,
          type: sql<string>`'universe_join'`,
          universeId: universeJoinRequestsTable.universeId,
          userId: universeJoinRequestsTable.userId,
          message: universeJoinRequestsTable.message,
          requestedAt: universeJoinRequestsTable.requestedAt,
          universeName: universesTable.name,
          universeSlug: universesTable.slug,
          username: usersTable.username,
          displayName: usersTable.displayName
        })
        .from(universeJoinRequestsTable)
        .leftJoin(universesTable, eq(universeJoinRequestsTable.universeId, universesTable.id))
        .leftJoin(usersTable, eq(universeJoinRequestsTable.userId, usersTable.id))
        .where(eq(universeJoinRequestsTable.status, 'pending'))
        .orderBy(desc(universeJoinRequestsTable.requestedAt)),

        // Universe Creation Approvals
        db.select({
          id: universesTable.id,
          type: sql<string>`'universe_creation'`,
          universeId: universesTable.id,
          userId: universesTable.creatorId,
          message: sql<string>`'Universe creation approval requested'`,
          requestedAt: universesTable.createdAt,
          universeName: universesTable.name,
          universeSlug: universesTable.slug,
          username: usersTable.username,
          displayName: usersTable.displayName
        })
        .from(universesTable)
        .leftJoin(usersTable, eq(universesTable.creatorId, usersTable.id))
        .where(
          and(
            eq(universesTable.isActive, false),
            eq(universesTable.isDeleted, false)
          )
        )
        .orderBy(desc(universesTable.createdAt))
        .catch(() => []),

        // User Verification Requests
        db.select({
          id: usersTable.id,
          type: sql<string>`'user_verification'`,
          universeId: sql<string>`NULL`,
          userId: usersTable.id,
          message: sql<string>`'User verification requested'`,
          requestedAt: usersTable.createdAt,
          universeName: sql<string>`NULL`,
          universeSlug: sql<string>`NULL`,
          username: usersTable.username,
          displayName: usersTable.displayName
        })
        .from(usersTable)
        .where(eq(usersTable.accountStatus, 'pending'))
        .orderBy(desc(usersTable.createdAt))
        .catch(() => [])
      ]);

      return {
        success: true,
        data: {
          universeJoinRequests,
          universeCreations,
          userVerifications 
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

      const userData = user[0];

      // User-Rollen prüfen
      let userRoles: any[] = [];
      try {
        userRoles = await db
          .select({
            roleName: rolesTable.name,
            roleDescription: rolesTable.description,
            permissions: rolesTable.permissions,
            isActive: userRolesTable.isActive,
            expiresAt: userRolesTable.expiresAt,
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
      } catch (roleError) {
        console.log('ℹ️ AdminService: User roles table not available yet');
      }

      const roles = userRoles.map(r => r.roleName) || [];
      
      const allPermissions: string[] = [];
      
      userRoles.forEach(role => {
        if (role.permissions) {
          let permissions: string[] = [];
          
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
          
          allPermissions.push(...permissions);
        }
      });
      
      const adminRoles = ['admin', 'super_admin', 'system_admin', 'moderator'];
      const isRoleAdmin = roles.some(role => adminRoles.includes(role));
      
      const adminPermissions = ['manage_users', 'view_reports', 'manage_universes', 'system_admin'];
      const hasAdminPermissions = allPermissions.some(perm => adminPermissions.includes(perm));

      const isStatusAdmin = userData.accountStatus === 'admin';

      const temporaryAdmins = {
        emails: ['admin@loop-it.com', 'developer@loop-it.com', 'test@admin.com', 'zerrelius@gmail.com'],
        usernames: ['admin', 'developer', 'testadmin', 'zerrelius']
      };

      const isTemporaryAdmin = 
        temporaryAdmins.emails.some(email => email.toLowerCase() === userData.email.toLowerCase()) ||
        temporaryAdmins.usernames.some(username => username.toLowerCase() === userData.username.toLowerCase());

      const isAdmin = isRoleAdmin || hasAdminPermissions || isStatusAdmin || isTemporaryAdmin;

      return {
        success: true,
        data: {
          isAdmin,
          adminSource: isRoleAdmin ? 'role' : hasAdminPermissions ? 'permission' : isStatusAdmin ? 'account_status' : isTemporaryAdmin ? 'temporary' : 'none',
          roles,
          permissions: allPermissions,
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email
          }
        }
      };

    } catch (error) {
      console.error('❌ AdminService: Error checking admin permissions:', error);
      return {
        success: false,
        error: 'Failed to check permissions',
        data: null
      };
    }
  }
}