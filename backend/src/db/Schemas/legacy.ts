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
  index
} from "drizzle-orm/pg-core";

// Legacy Chat Rooms (to be migrated to conversations system)
export const chatRoomsTable = pgTable("chat_rooms", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  type: varchar({ length: 20 }).default('public').notNull(), // 'public', 'private', 'direct'
  
  // Room Settings
  isActive: boolean().default(true).notNull(),
  maxMembers: integer().default(100).notNull(),
  allowGuests: boolean().default(false).notNull(),
  
  // Creator & Ownership
  createdBy: uuid().notNull(),
  ownerId: uuid().notNull(),
  
  // Legacy Settings (deprecated)
  password: varchar({ length: 255 }), // DEPRECATED: Use proper auth
  isPasswordProtected: boolean().default(false).notNull(), // DEPRECATED
  
  // Migration Status
  migrationStatus: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  migratedToConversationId: uuid(), // Reference to new conversation
  migrationNotes: text(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  
  // Mark as deprecated
  isDeprecated: boolean().default(true).notNull(),
}, (table) => ({
  nameIdx: index("chat_rooms_name_idx").on(table.name),
  typeIdx: index("chat_rooms_type_idx").on(table.type),
  ownerIdx: index("chat_rooms_owner_idx").on(table.ownerId),
  migrationStatusIdx: index("chat_rooms_migration_status_idx").on(table.migrationStatus),
}));

// Legacy Chat Room Members (to be migrated)
export const chatRoomMembersTable = pgTable("chat_room_members", {
  id: uuid().primaryKey().defaultRandom(),
  roomId: uuid().notNull(),
  userId: uuid().notNull(),
  role: varchar({ length: 20 }).default('member').notNull(), // 'member', 'moderator', 'admin'
  
  // Member Status
  isActive: boolean().default(true).notNull(),
  isMuted: boolean().default(false).notNull(),
  mutedUntil: timestamp(),
  
  // Join/Leave tracking
  joinedAt: timestamp().defaultNow().notNull(),
  leftAt: timestamp(),
  lastActiveAt: timestamp(),
  
  // Migration tracking
  migrationStatus: varchar({ length: 20 }).default('pending').notNull(),
  migratedToParticipantId: uuid(),
  
  // Mark as deprecated
  isDeprecated: boolean().default(true).notNull(),
}, (table) => ({
  roomUserUnique: unique().on(table.roomId, table.userId),
  roomIdx: index("chat_room_members_room_idx").on(table.roomId),
  userIdx: index("chat_room_members_user_idx").on(table.userId),
  roleIdx: index("chat_room_members_role_idx").on(table.role),
  migrationStatusIdx: index("chat_room_members_migration_status_idx").on(table.migrationStatus),
}));

// Legacy Chat Messages (to be migrated)
export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid().primaryKey().defaultRandom(),
  roomId: uuid().notNull(),
  userId: uuid().notNull(),
  
  // Message Content
  content: text(),
  messageType: varchar({ length: 20 }).default('text').notNull(), // 'text', 'image', 'file', 'system'
  
  // Legacy format attachments (deprecated)
  attachments: json(), // DEPRECATED: Use media system
  
  // Message Status
  isEdited: boolean().default(false).notNull(),
  editedAt: timestamp(),
  isDeleted: boolean().default(false).notNull(),
  deletedAt: timestamp(),
  
  // Legacy features (deprecated)
  isSystemMessage: boolean().default(false).notNull(), // DEPRECATED
  parentMessageId: uuid(), // DEPRECATED: Use replyToId in new system
  
  // Migration tracking
  migrationStatus: varchar({ length: 20 }).default('pending').notNull(),
  migratedToMessageId: uuid(),
  migrationErrors: text(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  
  // Mark as deprecated
  isDeprecated: boolean().default(true).notNull(),
}, (table) => ({
  roomIdx: index("chat_messages_room_idx").on(table.roomId),
  userIdx: index("chat_messages_user_idx").on(table.userId),
  typeIdx: index("chat_messages_type_idx").on(table.messageType),
  createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
  migrationStatusIdx: index("chat_messages_migration_status_idx").on(table.migrationStatus),
}));

// Migration Log (for tracking legacy to new system migration)
export const migrationLogTable = pgTable("migration_log", {
  id: uuid().primaryKey().defaultRandom(),
  
  // Migration Details
  migrationType: varchar({ length: 50 }).notNull(), // 'chat_room_to_conversation', 'member_to_participant', etc.
  legacyEntityType: varchar({ length: 50 }).notNull(), // 'chat_room', 'chat_message', etc.
  legacyEntityId: uuid().notNull(),
  newEntityType: varchar({ length: 50 }), // 'conversation', 'message', etc.
  newEntityId: uuid(),
  
  // Migration Status
  status: varchar({ length: 20 }).notNull(), // 'pending', 'in_progress', 'completed', 'failed', 'skipped'
  attemptCount: integer().default(0).notNull(),
  lastAttemptAt: timestamp(),
  
  // Error Handling
  errorMessage: text(),
  errorDetails: json(),
  canRetry: boolean().default(true).notNull(),
  
  // Data Mapping
  dataMapping: json(), // How legacy fields map to new fields
  migrationNotes: text(),
  
  // Validation
  isValidated: boolean().default(false).notNull(),
  validationErrors: json(),
  validatedAt: timestamp(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("migration_log_type_idx").on(table.migrationType),
  legacyEntityIdx: index("migration_log_legacy_entity_idx").on(table.legacyEntityType, table.legacyEntityId),
  statusIdx: index("migration_log_status_idx").on(table.status),
  attemptCountIdx: index("migration_log_attempt_count_idx").on(table.attemptCount),
}));

// Messages in Chat Rooms
export const messagesInChatRoomsTable = pgTable("messages_in_chat_rooms", {
  id: uuid().primaryKey().defaultRandom(),
  chatRoomId: uuid().notNull(), // Foreign key to chat rooms table
  message: varchar({ length: 1000 }), // Assuming a reasonable limit for chat room messages
  postedAt: timestamp().defaultNow().notNull(), // Assuming posted at is stored as a timestamp in milliseconds
  userId: uuid().notNull(), // Foreign key to users table
  
  // Migration tracking
  migrationStatus: varchar({ length: 20 }).default('pending').notNull(),
  migratedToMessageId: uuid(),
  migrationErrors: text(),
  
  // Mark as deprecated
  isDeprecated: boolean().default(true).notNull(),
}, (table) => ({
  chatRoomIdx: index("messages_chat_room_idx").on(table.chatRoomId),
  userIdx: index("messages_user_idx").on(table.userId),
  postedAtIdx: index("messages_posted_at_idx").on(table.postedAt),
  migrationStatusIdx: index("messages_migration_status_idx").on(table.migrationStatus),
}));

// Type exports
export type LegacyChatRoom = typeof chatRoomsTable.$inferSelect;
export type NewLegacyChatRoom = typeof chatRoomsTable.$inferInsert;
export type LegacyChatRoomMember = typeof chatRoomMembersTable.$inferSelect;
export type NewLegacyChatRoomMember = typeof chatRoomMembersTable.$inferInsert;
export type LegacyChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewLegacyChatMessage = typeof chatMessagesTable.$inferInsert;
export type MessagesInChatRoom = typeof messagesInChatRoomsTable.$inferSelect;
export type NewMessagesInChatRoom = typeof messagesInChatRoomsTable.$inferInsert;
export type MigrationLog = typeof migrationLogTable.$inferSelect;
export type NewMigrationLog = typeof migrationLogTable.$inferInsert;

/**
 * MIGRATION GUIDE
 * 
 * Legacy Chat System → Modern Conversation System:
 * 
 * chat_rooms → conversations
 * - name → name
 * - description → metadata.description
 * - type → type
 * - createdBy → createdBy
 * 
 * chat_room_members → conversation_participants
 * - roomId → conversationId
 * - userId → userId
 * - role → role
 * - joinedAt → joinedAt
 * 
 * chat_messages → messages
 * - roomId → conversationId
 * - userId → userId
 * - content → content
 * - messageType → messageType
 * - parentMessageId → replyToId
 * 
 * DEPRECATED FIELDS (not migrated):
 * - password, isPasswordProtected → Use proper auth system
 * - attachments → Use new media system
 * - isSystemMessage → Use messageType
 */