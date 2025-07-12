import { db } from '../db/connection';
import { profilesTable, friendshipsTable, universeMembersTable } from '../db/Schemas';
import { eq, and, or, sql } from 'drizzle-orm';

export class ChatPermissionService {
  
  // Prüfe ob User1 User2 anschreiben darf
  static async canUserSendMessage(senderId: string, recipientId: string): Promise<{ canMessage: boolean; reason?: string }> {
    try {
      console.log(`🔍 Checking chat permissions: ${senderId} → ${recipientId}`);

      // Selbst anschreiben verhindern
      if (senderId === recipientId) {
        return { canMessage: false, reason: 'Cannot message yourself' };
      }

      // Recipient's Message-Einstellungen abrufen
      const [recipientSettings] = await db
        .select({
          allowMessagesFrom: profilesTable.allowMessagesFrom
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, recipientId))
        .limit(1);

      if (!recipientSettings) {
        return { canMessage: false, reason: 'User not found' };
      }

      const messagePolicy = recipientSettings.allowMessagesFrom;
      console.log(`📋 Recipient message policy: ${messagePolicy}`);

      switch (messagePolicy) {
        case 'none':
          return { canMessage: false, reason: 'User does not accept messages' };

        case 'everyone':
          return { canMessage: true };

        case 'friends':
          const isFriend = await this.checkFriendship(senderId, recipientId);
          return { 
            canMessage: isFriend, 
            reason: isFriend ? undefined : 'User only accepts messages from friends' 
          };

        case 'universe_members':
          const shareUniverse = await this.checkSharedUniverse(senderId, recipientId);
          return { 
            canMessage: shareUniverse, 
            reason: shareUniverse ? undefined : 'User only accepts messages from universe members' 
          };

        default:
          return { canMessage: false, reason: 'Invalid message policy' };
      }

    } catch (error) {
      console.error('Error checking chat permissions:', error);
      return { canMessage: false, reason: 'Permission check failed' };
    }
  }

  // Prüfe Freundschaftsstatus
  private static async checkFriendship(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      const friendship = await db
        .select()
        .from(friendshipsTable)
        .where(
          and(
            or(
              and(
                eq(friendshipsTable.requesterId, user1Id),
                eq(friendshipsTable.addresseeId, user2Id)
              ),
              and(
                eq(friendshipsTable.requesterId, user2Id),
                eq(friendshipsTable.addresseeId, user1Id)
              )
            ),
            eq(friendshipsTable.status, 'accepted')
          )
        )
        .limit(1);

      return friendship.length > 0;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  }

  // Prüfe gemeinsame Universe-Mitgliedschaft
  private static async checkSharedUniverse(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      // Verwende Subquery oder Alias für bessere Performance
      const user1Universes = db
        .select({ universeId: universeMembersTable.universeId })
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.userId, user1Id),
            eq(universeMembersTable.isActive, true),
            eq(universeMembersTable.status, 'approved')
          )
        );

      const sharedUniverse = await db
        .select({ universeId: universeMembersTable.universeId })
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.userId, user2Id),
            eq(universeMembersTable.isActive, true),
            eq(universeMembersTable.status, 'approved'),
            // Check if universe is in user1's universes
            sql`${universeMembersTable.universeId} IN (${user1Universes})`
          )
        )
        .limit(1);

      return sharedUniverse.length > 0;
    } catch (error) {
      console.error('Error checking shared universe:', error);
      return false;
    }
  }

  // User's Message-Einstellungen abrufen
  static async getUserMessageSettings(userId: string) {
    try {
      const [settings] = await db
        .select({
          allowMessagesFrom: profilesTable.allowMessagesFrom
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      return {
        success: true,
        settings: settings || { allowMessagesFrom: 'friends' }
      };
    } catch (error) {
      console.error('Error getting user message settings:', error);
      return { success: false, error: 'Failed to get settings' };
    }
  }

  // User's Message-Einstellungen aktualisieren
  static async updateUserMessageSettings(userId: string, allowMessagesFrom: string) {
    try {
      // Validiere Eingabe
      const validOptions = ['everyone', 'universe_members', 'friends', 'none'];
      if (!validOptions.includes(allowMessagesFrom)) {
        return { success: false, error: 'Invalid message setting' };
      }

      await db
        .update(profilesTable)
        .set({ 
          allowMessagesFrom,
          updatedAt: new Date()
        })
        .where(eq(profilesTable.userId, userId));

      return { success: true };
    } catch (error) {
      console.error('Error updating user message settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }
}