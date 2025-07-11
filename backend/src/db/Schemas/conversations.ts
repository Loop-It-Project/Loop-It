import { 
  integer, 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  unique,
  foreignKey,
  index
} from "drizzle-orm/pg-core";
import { usersTable } from './users';

// Chat Conversations
export const conversationsTable = pgTable("conversations", {
  id: uuid().primaryKey().defaultRandom(),
  type: varchar({ length: 20 }).default('direct').notNull(), // 'direct', 'group'
  title: varchar({ length: 255 }), // Für Gruppenchats
  
  // Participants (für direct chats)
  participant1Id: uuid().notNull(),
  participant2Id: uuid().notNull(),
  
  // Status
  isActive: boolean().default(true).notNull(),
  isBlocked: boolean().default(false).notNull(),
  blockedBy: uuid(), // User ID der geblockt hat
  
  // Metadata
  lastMessageId: uuid(),
  lastMessageAt: timestamp(),
  
  // Match-based access (für später)
  requiresMatch: boolean().default(true).notNull(),
  matchId: uuid(), // Für späteren Matchmaking-Service
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  participant1Participant2Unique: unique().on(table.participant1Id, table.participant2Id),
  participant1Idx: index("conversations_participant1_idx").on(table.participant1Id),
  participant2Idx: index("conversations_participant2_idx").on(table.participant2Id),
  lastMessageAtIdx: index("conversations_last_message_at_idx").on(table.lastMessageAt),
}));

// Chat Messages
export const messagesTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull(),
  senderId: uuid().notNull(),
  
  // Message Content
  content: text().notNull(),
  messageType: varchar({ length: 20 }).default('text').notNull(), // 'text', 'image', 'file', 'system'
  attachments: json(), // Array von Attachment-URLs
  
  // Message Status
  isEdited: boolean().default(false).notNull(),
  editedAt: timestamp(),
  isDeleted: boolean().default(false).notNull(),
  deletedAt: timestamp(),
  
  // Read Status
  isRead: boolean().default(false).notNull(),
  readAt: timestamp(),
  
  // Reply/Thread
  replyToId: uuid(), // ID der Nachricht auf die geantwortet wird
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("messages_conversation_idx").on(table.conversationId),
  senderIdx: index("messages_sender_idx").on(table.senderId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  conversationCreatedAtIdx: index("messages_conversation_created_at_idx").on(table.conversationId, table.createdAt),
}));

// Chat Participants (für Gruppenchats und erweiterte Features)
export const chatParticipantsTable = pgTable("chat_participants", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull(),
  userId: uuid().notNull(),
  
  // Permissions
  role: varchar({ length: 20 }).default('member').notNull(), // 'admin', 'member'
  canWrite: boolean().default(true).notNull(),
  
  // Notification Settings
  muteUntil: timestamp(),
  emailNotifications: boolean().default(true).notNull(),
  pushNotifications: boolean().default(true).notNull(),
  
  // Status
  isActive: boolean().default(true).notNull(),
  lastSeenAt: timestamp(),
  
  joinedAt: timestamp().defaultNow().notNull(),
  leftAt: timestamp(),
}, (table) => ({
  conversationUserUnique: unique().on(table.conversationId, table.userId),
  conversationIdx: index("chat_participants_conversation_idx").on(table.conversationId),
  userIdx: index("chat_participants_user_idx").on(table.userId),
}));

// Typing Indicators (für Echtzeit-Features)
export const typingIndicatorsTable = pgTable("typing_indicators", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull(),
  userId: uuid().notNull(),
  
  startedAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp().notNull(), // Auto-cleanup nach 10 Sekunden
}, (table) => ({
  conversationUserUnique: unique().on(table.conversationId, table.userId),
  conversationIdx: index("typing_indicators_conversation_idx").on(table.conversationId),
  expiresAtIdx: index("typing_indicators_expires_at_idx").on(table.expiresAt),
}));

// Type exports
export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;
export type ChatParticipant = typeof chatParticipantsTable.$inferSelect;
export type NewChatParticipant = typeof chatParticipantsTable.$inferInsert;
export type TypingIndicator = typeof typingIndicatorsTable.$inferSelect;
export type NewTypingIndicator = typeof typingIndicatorsTable.$inferInsert;