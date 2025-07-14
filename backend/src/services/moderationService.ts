import { db } from '../db/connection';
import { universeChatMessagesTable, universeChatModerationTable } from '../db/Schemas';
import { eq, and, desc, gt } from 'drizzle-orm';

export class ModerationService {
  // Profanity Filter - Einfache Implementierung
  private static profanityWords = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'idiot', 'stupid',
    // Deutsche Schimpfwörter
    'scheiße', 'scheisse', 'arschloch', 'idiot', 'blöd', 'doof', 'dumm'
  ];

  // Spam Detection
  private static spamPatterns = [
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /\b(https?:\/\/[^\s]+)\b/g, // URLs
    /\b[A-Z]{5,}\b/g, // ALL CAPS words
    /(.{1,20})\1{3,}/g // Repeated phrases
  ];

  // Check if message contains profanity
  static containsProfanity(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.profanityWords.some(word => lowerContent.includes(word));
  }

  // Check if message is spam
  static isSpam(content: string): boolean {
    return this.spamPatterns.some(pattern => pattern.test(content));
  }

  // Moderate message content
  static moderateMessage(content: string): { 
    isAllowed: boolean; 
    reason?: string; 
    filteredContent?: string; 
  } {
    // Check for spam
    if (this.isSpam(content)) {
      return {
        isAllowed: false,
        reason: 'Message contains spam patterns'
      };
    }

    // Check for profanity
    if (this.containsProfanity(content)) {
      // Option 1: Block message completely
      return {
        isAllowed: false,
        reason: 'Message contains inappropriate language'
      };
      
      // Option 2: Filter profanity (alternative)
      // const filteredContent = this.filterProfanity(content);
      // return {
      //   isAllowed: true,
      //   filteredContent
      // };
    }

    // Check message length
    if (content.length > 1000) {
      return {
        isAllowed: false,
        reason: 'Message is too long'
      };
    }

    // Check for excessive newlines
    if (content.split('\n').length > 10) {
      return {
        isAllowed: false,
        reason: 'Message contains too many line breaks'
      };
    }

    return { isAllowed: true };
  }

  // Filter profanity (replace with stars)
  private static filterProfanity(content: string): string {
    let filtered = content;
    this.profanityWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    return filtered;
  }

  // Check if user is rate limited
  static async isRateLimited(userId: string, universeId: string): Promise<boolean> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      
      const recentMessages = await db
        .select()
        .from(universeChatMessagesTable)
        .where(
          and(
            eq(universeChatMessagesTable.senderId, userId),
            eq(universeChatMessagesTable.universeId, universeId),
            gt(universeChatMessagesTable.createdAt, oneMinuteAgo) // SQL: createdAt > oneMinuteAgo
          )
        )
        .orderBy(desc(universeChatMessagesTable.createdAt))
        .limit(10);

      // Max 10 messages per minute
      return recentMessages.length >= 10;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  // Log moderation action
  static async logModerationAction(
    universeId: string,
    moderatorId: string,
    targetUserId: string | null,
    actionType: string,
    reason?: string,
    messageId?: string
  ): Promise<void> {
    try {
      await db
        .insert(universeChatModerationTable)
        .values({
          universeId,
          moderatorId,
          targetUserId: targetUserId,
          actionType,
          actionReason: reason,
          targetMessageId: messageId,
          createdAt: new Date()
        });
    } catch (error) {
      console.error('Error logging moderation action:', error);
    }
  }

  // Check if user is banned
  static async isUserBanned(userId: string, universeId: string): Promise<boolean> {
    try {
      const banRecord = await db
        .select()
        .from(universeChatModerationTable)
        .where(
          and(
            eq(universeChatModerationTable.targetUserId, userId),
            eq(universeChatModerationTable.universeId, universeId),
            eq(universeChatModerationTable.actionType, 'ban')
          )
        )
        .orderBy(desc(universeChatModerationTable.createdAt))
        .limit(1);

      if (banRecord.length === 0) return false;

      // Check if there's a more recent unban
      const unbanRecord = await db
        .select()
        .from(universeChatModerationTable)
        .where(
          and(
            eq(universeChatModerationTable.targetUserId, userId),
            eq(universeChatModerationTable.universeId, universeId),
            eq(universeChatModerationTable.actionType, 'unban')
          )
        )
        .orderBy(desc(universeChatModerationTable.createdAt))
        .limit(1);

      if (unbanRecord.length === 0) return true;

      // User is banned if ban is more recent than unban
      return banRecord[0].createdAt > unbanRecord[0].createdAt;
    } catch (error) {
      console.error('Error checking user ban status:', error);
      return false;
    }
  }

  // Ban user from universe chat
  static async banUser(
    universeId: string, 
    moderatorId: string, 
    targetUserId: string, 
    reason?: string,
    duration?: number // in minutes
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : undefined;

      await db
        .insert(universeChatModerationTable)
        .values({
          universeId,
          moderatorId,
          targetUserId,
          actionType: 'ban',
          actionReason: reason,
          duration,
          expiresAt,
          createdAt: new Date()
        });

      console.log(`🔨 User ${targetUserId} banned from universe ${universeId} by ${moderatorId}`);
      return { success: true };
    } catch (error) {
      console.error('Error banning user:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }

  // Unban user from universe chat
  static async unbanUser(
    universeId: string,
    moderatorId: string,
    targetUserId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await db
        .insert(universeChatModerationTable)
        .values({
          universeId,
          moderatorId,
          targetUserId,
          actionType: 'unban',
          actionReason: reason,
          createdAt: new Date()
        });

      console.log(`✅ User ${targetUserId} unbanned from universe ${universeId} by ${moderatorId}`);
      return { success: true };
    } catch (error) {
      console.error('Error unbanning user:', error);
      return { success: false, error: 'Failed to unban user' };
    }
  }

  // Mute user in universe chat
  static async muteUser(
    universeId: string,
    moderatorId: string,
    targetUserId: string,
    duration: number, // in minutes
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);

      await db
        .insert(universeChatModerationTable)
        .values({
          universeId,
          moderatorId,
          targetUserId,
          actionType: 'mute',
          actionReason: reason,
          duration,
          expiresAt,
          createdAt: new Date()
        });

      console.log(`🔇 User ${targetUserId} muted in universe ${universeId} for ${duration} minutes`);
      return { success: true };
    } catch (error) {
      console.error('Error muting user:', error);
      return { success: false, error: 'Failed to mute user' };
    }
  }
}