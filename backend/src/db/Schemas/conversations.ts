import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  unique,
  index
} from "drizzle-orm/pg-core";

// Modern Conversation System
export const conversationsTable = pgTable("conversations", {
  id: uuid().primaryKey().defaultRandom(),
  type: varchar({ length: 20 }).notNull(),
  name: varchar({ length: 255 }),
  universeId: uuid(),
  createdBy: uuid().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  isActive: boolean().default(true).notNull(),
}, (table) => ({
  typeIdx: index("conversations_type_idx").on(table.type),
  universeIdIdx: index("conversations_universe_id_idx").on(table.universeId),
}));

export const conversationParticipantsTable = pgTable("conversation_participants", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull(),
  userId: uuid().notNull(),
  role: varchar({ length: 20 }).default('member').notNull(),
  joinedAt: timestamp().defaultNow().notNull(),
  lastReadAt: timestamp(),
  isActive: boolean().default(true).notNull(),
}, (table) => ({
  conversationUserUnique: unique().on(table.conversationId, table.userId),
  conversationIdIdx: index("conv_participants_conv_id_idx").on(table.conversationId),
  userIdIdx: index("conv_participants_user_id_idx").on(table.userId),
}));

export const messagesTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull(),
  userId: uuid().notNull(),
  content: text(),
  mediaId: uuid(),
  messageType: varchar({ length: 20 }).default('text').notNull(),
  replyToId: uuid(),
  editedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  isDeleted: boolean().default(false).notNull(),
}, (table) => ({
  conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  userIdIdx: index("messages_user_id_idx").on(table.userId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

// Type exports
export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;
export type ConversationParticipant = typeof conversationParticipantsTable.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipantsTable.$inferInsert;