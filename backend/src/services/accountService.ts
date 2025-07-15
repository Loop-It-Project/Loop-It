import { db } from '../db/connection';
import { 
  usersTable, 
  profilesTable, 
  postsTable, 
  commentsTable,
  conversationsTable,
  messagesTable,
  friendshipsTable,
  userBlocksTable,
  universeMembersTable,
  postReactionsTable,
  commentReactionsTable,
  refreshTokensTable,
  userActivitiesTable,
  bugReportsTable
} from '../db/Schemas';
import { eq, and, or, sql } from 'drizzle-orm';
import { TokenService } from './tokenService';

export class AccountService {
  
  // Account deaktivieren
  static async deactivateAccount(userId: string, reason?: string) {
    try {
      console.log(`🔒 Deactivating account for user: ${userId}`);
      
      // User als inaktiv markieren
      await db
        .update(usersTable)
        .set({
          accountStatus: 'deactivated',
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      // Alle Refresh Tokens des Users revoken
      await TokenService.revokeAllUserTokens(userId);

      // Posts auf privat setzen (nicht löschen)
      await db
        .update(postsTable)
        .set({
          isPublic: false,
          updatedAt: new Date()
        })
        .where(eq(postsTable.authorId, userId));

      // Profile auf privat setzen
      await db
        .update(profilesTable)
        .set({
          profileVisibility: 'private',
          updatedAt: new Date()
        })
        .where(eq(profilesTable.userId, userId));

      // Universe-Mitgliedschaften deaktivieren
      await db
        .update(universeMembersTable)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(universeMembersTable.userId, userId));

      // Aktivitäts-Log
      await db
        .insert(userActivitiesTable)
        .values({
          userId,
          activityType: 'account_deactivated',
          metadata: { reason, timestamp: new Date().toISOString() }
        });

      console.log(`✅ Account deactivated successfully for user: ${userId}`);
      
      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      console.error('❌ Error deactivating account:', error);
      throw error;
    }
  }

  // Account reaktivieren
  static async reactivateAccount(userId: string) {
    try {
      console.log(`🔓 Reactivating account for user: ${userId}`);
      
      // User als aktiv markieren
      await db
        .update(usersTable)
        .set({
          accountStatus: 'active',
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      // Posts wieder öffentlich machen
      await db
        .update(postsTable)
        .set({
          isPublic: true,
          updatedAt: new Date()
        })
        .where(eq(postsTable.authorId, userId));

      // Profile wieder öffentlich machen
      await db
        .update(profilesTable)
        .set({
          profileVisibility: 'public',
          updatedAt: new Date()
        })
        .where(eq(profilesTable.userId, userId));

      // Universe-Mitgliedschaften reaktivieren
      await db
        .update(universeMembersTable)
        .set({
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(universeMembersTable.userId, userId));

      // Aktivitäts-Log
      await db
        .insert(userActivitiesTable)
        .values({
          userId,
          activityType: 'account_reactivated',
          metadata: { timestamp: new Date().toISOString() }
        });

      console.log(`✅ Account reactivated successfully for user: ${userId}`);
      
      return {
        success: true,
        message: 'Account reactivated successfully'
      };
    } catch (error) {
      console.error('❌ Error reactivating account:', error);
      throw error;
    }
  }

  // Account komplett löschen (GDPR)
  static async deleteAccount(userId: string, reason?: string) {
    try {
      console.log(`🗑️ Permanently deleting account for user: ${userId}`);
      
      // 1. User-Daten für Cleanup sammeln
      const userData = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (userData.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      console.log(`📋 Deleting data for user: ${userData[0].username}`);

      // 2. Bug Reports löschen
      await db
        .delete(bugReportsTable)
        .where(eq(bugReportsTable.reporterId, userId));

      // 3. User Activities löschen
      await db
        .delete(userActivitiesTable)
        .where(eq(userActivitiesTable.userId, userId));

      // 4. Refresh Tokens löschen
      await db
        .delete(refreshTokensTable)
        .where(eq(refreshTokensTable.userId, userId));

      // 5. Reactions löschen
      await db
        .delete(postReactionsTable)
        .where(eq(postReactionsTable.userId, userId));

      await db
        .delete(commentReactionsTable)
        .where(eq(commentReactionsTable.userId, userId));

      // 6. Comments löschen
      await db
        .delete(commentsTable)
        .where(eq(commentsTable.authorId, userId));

      // 7. Posts löschen
      await db
        .delete(postsTable)
        .where(eq(postsTable.authorId, userId));

      // 8. Universe Memberships löschen
      await db
        .delete(universeMembersTable)
        .where(eq(universeMembersTable.userId, userId));

      // 9. Messages löschen
      await db
        .delete(messagesTable)
        .where(eq(messagesTable.senderId, userId));

      // 10. Conversations löschen wo User beteiligt war
      await db
        .delete(conversationsTable)
        .where(
          or(
            eq(conversationsTable.participant1Id, userId),
            eq(conversationsTable.participant2Id, userId)
          )
        );

      // 11. User Blocks löschen
      await db
        .delete(userBlocksTable)
        .where(
          or(
            eq(userBlocksTable.blockerId, userId),
            eq(userBlocksTable.blockedId, userId)
          )
        );

      // 12. Friendships löschen
      await db
        .delete(friendshipsTable)
        .where(
          or(
            eq(friendshipsTable.requesterId, userId),
            eq(friendshipsTable.addresseeId, userId)
          )
        );

      // 13. Profile löschen
      await db
        .delete(profilesTable)
        .where(eq(profilesTable.userId, userId));

      // 14. User selbst löschen
      await db
        .delete(usersTable)
        .where(eq(usersTable.id, userId));

      console.log(`✅ Account permanently deleted for user: ${userData[0].username}`);
      
      return {
        success: true,
        message: 'Account permanently deleted',
        deletedUser: {
          id: userData[0].id,
          username: userData[0].username,
          email: userData[0].email
        }
      };
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      throw error;
    }
  }

  // Account-Status prüfen
  static async getAccountStatus(userId: string) {
    try {
      const user = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          accountStatus: usersTable.accountStatus,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt
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

      return {
        success: true,
        data: user[0]
      };
    } catch (error) {
      console.error('❌ Error getting account status:', error);
      throw error;
    }
  }

  // Deletion Impact Report (zeigt was gelöscht werden würde)
  static async getDeletionImpactReport(userId: string) {
    try {
      const [postsCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(postsTable)
        .where(eq(postsTable.authorId, userId));

      const [commentsCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(commentsTable)
        .where(eq(commentsTable.authorId, userId));

      const [universesCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(universeMembersTable)
        .where(eq(universeMembersTable.userId, userId));

      const [friendsCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(friendshipsTable)
        .where(
          and(
            eq(friendshipsTable.requesterId, userId),
            eq(friendshipsTable.status, 'accepted')
          )
        );

      const [bugReportsCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(bugReportsTable)
        .where(eq(bugReportsTable.reporterId, userId));

      return {
        success: true,
        data: {
          posts: postsCount?.count || 0,
          comments: commentsCount?.count || 0,
          universes: universesCount?.count || 0,
          friends: friendsCount?.count || 0,
          bugReports: bugReportsCount?.count || 0
        }
      };
    } catch (error) {
      console.error('❌ Error getting deletion impact report:', error);
      throw error;
    }
  }
}