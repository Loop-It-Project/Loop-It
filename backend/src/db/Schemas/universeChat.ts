import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  index,
  unique,
  integer
} from "drizzle-orm/pg-core";

// Universe Chat Rooms
export const universeChatRoomsTable = pgTable("universe_chat_rooms", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  
  // Room Settings
  isActive: boolean().default(true).notNull(),
  isLocked: boolean().default(false).notNull(), // Moderator kann Chat sperren
  slowMode: boolean().default(false).notNull(), // Verzögerung zwischen Nachrichten
  slowModeDelay: integer().default(5).notNull(), // Sekunden
  
  // Moderation
  allowedRoles: json().default(['member', 'moderator', 'creator']).notNull(),
  bannedWords: json().default([]).notNull(),
  autoModeration: boolean().default(true).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  universeIdx: index("universe_chat_rooms_universe_idx").on(table.universeId),
  universeUnique: unique().on(table.universeId), // Ein Chat pro Universe
}));

// Universe Chat Messages
export const universeChatMessagesTable = pgTable("universe_chat_messages", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(), // Für einfachere Queries
  senderId: uuid(),
  
  // Message Content
  content: text().notNull(),
  messageType: varchar({ length: 20 }).default('text').notNull(), // 'text', 'system', 'moderator'
  
  // Moderation
  isDeleted: boolean().default(false).notNull(),
  deletedBy: uuid(), // Moderator ID
  deletedAt: timestamp(),
  deletionReason: text(),
  
  // System Messages
  isSystemMessage: boolean().default(false).notNull(),
  systemData: json(), // Für Join/Leave/Mod Actions
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  universeIdx: index("universe_chat_messages_universe_idx").on(table.universeId),
  senderIdx: index("universe_chat_messages_sender_idx").on(table.senderId),
  createdAtIdx: index("universe_chat_messages_created_at_idx").on(table.createdAt),
}));

// Universe Chat Participants (aktive Teilnehmer)
export const universeChatParticipantsTable = pgTable("universe_chat_participants", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  userId: uuid().notNull(),
  
  // Participant Status
  isActive: boolean().default(true).notNull(),
  isMuted: boolean().default(false).notNull(),
  mutedUntil: timestamp(),
  mutedBy: uuid(),
  
  // Timestamps
  joinedAt: timestamp().defaultNow().notNull(),
  lastSeenAt: timestamp().defaultNow().notNull(),
  leftAt: timestamp(),
}, (table) => ({
  universeUserUnique: unique().on(table.universeId, table.userId),
  universeIdx: index("universe_chat_participants_universe_idx").on(table.universeId),
  userIdx: index("universe_chat_participants_user_idx").on(table.userId),
  isActiveIdx: index("universe_chat_participants_active_idx").on(table.isActive),
}));

// Universe Chat Moderation Log
export const universeChatModerationTable = pgTable("universe_chat_moderation", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  moderatorId: uuid().notNull(),
  targetUserId: uuid(),
  targetMessageId: uuid(),
  
  // Action Details
  actionType: varchar({ length: 50 }).notNull(), // 'delete_message', 'mute_user', 'ban_user', 'slow_mode'
  actionReason: text(),
  actionData: json(), // Additional data für spezifische Actions
  
  // Duration (für temporäre Actions)
  duration: integer(), // in Minuten
  expiresAt: timestamp(),
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  universeIdx: index("universe_chat_moderation_universe_idx").on(table.universeId),
  moderatorIdx: index("universe_chat_moderation_moderator_idx").on(table.moderatorId),
  targetUserIdx: index("universe_chat_moderation_target_user_idx").on(table.targetUserId),
  actionTypeIdx: index("universe_chat_moderation_action_type_idx").on(table.actionType),
}));

// Type exports
export type UniverseChatRoom = typeof universeChatRoomsTable.$inferSelect;
export type NewUniverseChatRoom = typeof universeChatRoomsTable.$inferInsert;
export type UniverseChatMessage = typeof universeChatMessagesTable.$inferSelect;
export type NewUniverseChatMessage = typeof universeChatMessagesTable.$inferInsert;
export type UniverseChatParticipant = typeof universeChatParticipantsTable.$inferSelect;
export type NewUniverseChatParticipant = typeof universeChatParticipantsTable.$inferInsert;
export type UniverseChatModeration = typeof universeChatModerationTable.$inferSelect;
export type NewUniverseChatModeration = typeof universeChatModerationTable.$inferInsert;