import { 
  pgTable, 
  uuid, 
  varchar, 
  boolean, 
  timestamp, 
  integer,
  text,
  json,
  index,
  unique,
  foreignKey
} from "drizzle-orm/pg-core";
import { usersTable } from './users';

// Swipe Actions (Likes/Skips)
export const swipeActionsTable = pgTable("swipe_actions", {
  id: uuid().primaryKey().defaultRandom(),
  swiperId: uuid().notNull(),
  targetId: uuid().notNull(),
  action: varchar({ length: 20 }).notNull(), // 'like', 'skip', 'super_like'
  timestamp: timestamp().defaultNow().notNull(),
  isActive: boolean().default(true).notNull(),
  context: json(), // Additional context like location, filters used
}, (table) => ({
  swiperTargetUnique: unique().on(table.swiperId, table.targetId),
  swiperIdx: index("swipe_actions_swiper_idx").on(table.swiperId),
  targetIdx: index("swipe_actions_target_idx").on(table.targetId),
  actionIdx: index("swipe_actions_action_idx").on(table.action),
  timestampIdx: index("swipe_actions_timestamp_idx").on(table.timestamp),
}));

// Matches (Mutual Likes)
export const matchesTable = pgTable("matches", {
  id: uuid().primaryKey().defaultRandom(),
  user1Id: uuid().notNull(),
  user2Id: uuid().notNull(),
  matchedAt: timestamp().defaultNow().notNull(),
  isActive: boolean().default(true).notNull(),
  conversationId: uuid(), // Reference to conversation if chat started
  matchQuality: integer().default(0).notNull(), // 0-100 compatibility score
  commonInterests: json(), // Shared hobbies/interests
  lastInteraction: timestamp(),
  status: varchar({ length: 20 }).default('active').notNull(), // 'active', 'archived', 'blocked'
}, (table) => ({
  user1User2Unique: unique().on(table.user1Id, table.user2Id),
  user1Idx: index("matches_user1_idx").on(table.user1Id),
  user2Idx: index("matches_user2_idx").on(table.user2Id),
  matchedAtIdx: index("matches_matched_at_idx").on(table.matchedAt),
  statusIdx: index("matches_status_idx").on(table.status),
}));

// Swipe Preferences & Filters
export const swipePreferencesTable = pgTable("swipe_preferences", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().unique(),
  maxDistance: integer().default(50).notNull(), // km
  minAge: integer().default(18).notNull(),
  maxAge: integer().default(99).notNull(),
  showMe: varchar({ length: 20 }).default('everyone').notNull(), // 'everyone', 'male', 'female', 'other'
  requireCommonInterests: boolean().default(false).notNull(),
  minCommonInterests: integer().default(1).notNull(),
  excludeAlreadySwiped: boolean().default(true).notNull(),
  onlyShowActiveUsers: boolean().default(true).notNull(),
  preferredHobbies: json(), // Array of hobby preferences
  dealbreakers: json(), // Array of deal breakers
  isVisible: boolean().default(true).notNull(), // Show me in others' swipe deck
  isPremium: boolean().default(false).notNull(),
  lastUpdated: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("swipe_preferences_user_id_idx").on(table.userId),
}));

// Swipe Statistics
export const swipeStatsTable = pgTable("swipe_stats", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().unique(),
  totalSwipes: integer().default(0).notNull(),
  totalLikes: integer().default(0).notNull(),
  totalSkips: integer().default(0).notNull(),
  totalMatches: integer().default(0).notNull(),
  likesReceived: integer().default(0).notNull(),
  skipsReceived: integer().default(0).notNull(),
  matchesReceived: integer().default(0).notNull(),
  averageMatchQuality: integer().default(0).notNull(),
  lastSwipeAt: timestamp(),
  swipeStreak: integer().default(0).notNull(),
  bestMatchQuality: integer().default(0).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("swipe_stats_user_id_idx").on(table.userId),
}));

// Swipe Queue (Pre-calculated potential matches)
export const swipeQueueTable = pgTable("swipe_queue", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  potentialMatchId: uuid().notNull(),
  compatibilityScore: integer().default(0).notNull(),
  commonInterests: json(),
  distance: integer(), // in km
  priority: integer().default(0).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp().notNull(),
  isShown: boolean().default(false).notNull(),
}, (table) => ({
  userIdIdx: index("swipe_queue_user_id_idx").on(table.userId),
  potentialMatchIdx: index("swipe_queue_potential_match_idx").on(table.potentialMatchId),
  priorityIdx: index("swipe_queue_priority_idx").on(table.priority),
  expiresAtIdx: index("swipe_queue_expires_at_idx").on(table.expiresAt),
}));

// Type exports
export type SwipeAction = typeof swipeActionsTable.$inferSelect;
export type NewSwipeAction = typeof swipeActionsTable.$inferInsert;
export type Match = typeof matchesTable.$inferSelect;
export type NewMatch = typeof matchesTable.$inferInsert;
export type SwipePreferences = typeof swipePreferencesTable.$inferSelect;
export type NewSwipePreferences = typeof swipePreferencesTable.$inferInsert;
export type SwipeStats = typeof swipeStatsTable.$inferSelect;
export type NewSwipeStats = typeof swipeStatsTable.$inferInsert;
export type SwipeQueue = typeof swipeQueueTable.$inferSelect;
export type NewSwipeQueue = typeof swipeQueueTable.$inferInsert;