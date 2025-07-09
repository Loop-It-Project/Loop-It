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

// Moderation Reports System
export const moderationReportsTable = pgTable("moderation_reports", {
  id: uuid().primaryKey().defaultRandom(),
  reporterId: uuid().notNull(),
  reportedUserId: uuid(),
  reportedContentType: varchar({ length: 50 }).notNull(), // 'post', 'comment', 'user', 'universe'
  reportedContentId: uuid().notNull(),
  
  // Report Details
  reason: varchar({ length: 100 }).notNull(),
  description: text(),
  category: varchar({ length: 50 }).notNull(), // 'spam', 'harassment', 'inappropriate', etc.
  severity: varchar({ length: 20 }).default('medium').notNull(), // 'low', 'medium', 'high', 'critical'
  
  // Status & Review
  status: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'reviewing', 'resolved', 'dismissed'
  priority: integer().default(3).notNull(), // 1 = high, 5 = low
  reviewedBy: uuid(),
  reviewedAt: timestamp(),
  resolution: text(),
  actionTaken: text(),
  
  // Additional Context
  reporterIpAddress: varchar({ length: 45 }),
  additionalData: json(), // Screenshots, URLs, etc.
  internalNotes: text(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index("moderation_reports_reporter_idx").on(table.reporterId),
  reportedUserIdx: index("moderation_reports_reported_user_idx").on(table.reportedUserId),
  contentIdx: index("moderation_reports_content_idx").on(table.reportedContentType, table.reportedContentId),
  statusIdx: index("moderation_reports_status_idx").on(table.status),
  priorityIdx: index("moderation_reports_priority_idx").on(table.priority),
  createdAtIdx: index("moderation_reports_created_at_idx").on(table.createdAt),
}));

// Moderation Actions Log
export const moderationActionsTable = pgTable("moderation_actions", {
  id: uuid().primaryKey().defaultRandom(),
  reportId: uuid(),
  moderatorId: uuid().notNull(),
  targetUserId: uuid(),
  targetContentId: uuid(),
  targetContentType: varchar({ length: 50 }),
  
  // Action Details
  actionType: varchar({ length: 50 }).notNull(), // 'warning', 'timeout', 'ban', 'delete_content', etc.
  actionReason: text().notNull(),
  actionDuration: integer(), // in hours for timeouts
  isReversible: boolean().default(true).notNull(),
  
  // Status
  isActive: boolean().default(true).notNull(),
  reversedAt: timestamp(),
  reversedBy: uuid(),
  reversalReason: text(),
  
  // Metadata
  metadata: json(),
  internalNotes: text(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  reportIdx: index("moderation_actions_report_idx").on(table.reportId),
  moderatorIdx: index("moderation_actions_moderator_idx").on(table.moderatorId),
  targetUserIdx: index("moderation_actions_target_user_idx").on(table.targetUserId),
  actionTypeIdx: index("moderation_actions_action_type_idx").on(table.actionType),
  createdAtIdx: index("moderation_actions_created_at_idx").on(table.createdAt),
}));

// User Strikes/Warnings System
export const userStrikesTable = pgTable("user_strikes", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  issuedBy: uuid().notNull(),
  reportId: uuid(),
  
  // Strike Details
  strikeType: varchar({ length: 50 }).notNull(), // 'warning', 'minor', 'major', 'severe'
  reason: text().notNull(),
  description: text(),
  relatedContentId: uuid(),
  relatedContentType: varchar({ length: 50 }),
  
  // Status
  isActive: boolean().default(true).notNull(),
  isExpired: boolean().default(false).notNull(),
  expiresAt: timestamp(),
  revokedAt: timestamp(),
  revokedBy: uuid(),
  revokedReason: text(),
  
  // Appeal
  appealedAt: timestamp(),
  appealReason: text(),
  appealStatus: varchar({ length: 20 }).default('none').notNull(), // 'none', 'pending', 'approved', 'denied'
  appealReviewedBy: uuid(),
  appealReviewedAt: timestamp(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_strikes_user_idx").on(table.userId),
  issuedByIdx: index("user_strikes_issued_by_idx").on(table.issuedBy),
  reportIdx: index("user_strikes_report_idx").on(table.reportId),
  strikeTypeIdx: index("user_strikes_strike_type_idx").on(table.strikeType),
  isActiveIdx: index("user_strikes_is_active_idx").on(table.isActive),
  expiresAtIdx: index("user_strikes_expires_at_idx").on(table.expiresAt),
}));

// Content Moderation Queue
export const moderationQueueTable = pgTable("moderation_queue", {
  id: uuid().primaryKey().defaultRandom(),
  contentType: varchar({ length: 50 }).notNull(), // 'post', 'comment', 'universe', 'media'
  contentId: uuid().notNull(),
  contentAuthorId: uuid().notNull(),
  
  // Queue Details
  queueType: varchar({ length: 50 }).notNull(), // 'auto_flagged', 'user_reported', 'manual_review'
  priority: integer().default(3).notNull(), // 1 = urgent, 5 = low
  flaggedReason: varchar({ length: 100 }),
  autoFlagScore: integer(), // AI confidence score 0-100
  
  // Assignment
  assignedTo: uuid(),
  assignedAt: timestamp(),
  reviewedBy: uuid(),
  reviewedAt: timestamp(),
  
  // Status
  status: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'in_review', 'approved', 'rejected'
  reviewDecision: varchar({ length: 50 }),
  reviewNotes: text(),
  actionRequired: boolean().default(false).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  contentIdx: index("moderation_queue_content_idx").on(table.contentType, table.contentId),
  authorIdx: index("moderation_queue_author_idx").on(table.contentAuthorId),
  queueTypeIdx: index("moderation_queue_queue_type_idx").on(table.queueType),
  priorityIdx: index("moderation_queue_priority_idx").on(table.priority),
  statusIdx: index("moderation_queue_status_idx").on(table.status),
  assignedToIdx: index("moderation_queue_assigned_to_idx").on(table.assignedTo),
}));

// Banned Content Patterns
export const bannedPatternsTable = pgTable("banned_patterns", {
  id: uuid().primaryKey().defaultRandom(),
  pattern: text().notNull(),
  patternType: varchar({ length: 20 }).notNull(), // 'regex', 'keyword', 'phrase', 'url'
  category: varchar({ length: 50 }).notNull(), // 'spam', 'profanity', 'hate_speech', etc.
  
  // Settings
  severity: varchar({ length: 20 }).default('medium').notNull(),
  autoAction: varchar({ length: 20 }).default('flag').notNull(), // 'flag', 'hide', 'delete'
  isActive: boolean().default(true).notNull(),
  
  // Metadata
  description: text(),
  createdBy: uuid().notNull(),
  lastModifiedBy: uuid(),
  hitCount: integer().default(0).notNull(), // How many times this pattern was triggered
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  patternTypeIdx: index("banned_patterns_pattern_type_idx").on(table.patternType),
  categoryIdx: index("banned_patterns_category_idx").on(table.category),
  isActiveIdx: index("banned_patterns_is_active_idx").on(table.isActive),
}));

// Type exports
export type ModerationReport = typeof moderationReportsTable.$inferSelect;
export type NewModerationReport = typeof moderationReportsTable.$inferInsert;
export type ModerationAction = typeof moderationActionsTable.$inferSelect;
export type NewModerationAction = typeof moderationActionsTable.$inferInsert;
export type UserStrike = typeof userStrikesTable.$inferSelect;
export type NewUserStrike = typeof userStrikesTable.$inferInsert;
export type ModerationQueue = typeof moderationQueueTable.$inferSelect;
export type NewModerationQueue = typeof moderationQueueTable.$inferInsert;
export type BannedPattern = typeof bannedPatternsTable.$inferSelect;
export type NewBannedPattern = typeof bannedPatternsTable.$inferInsert;