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

import { usersTable } from "./users";


// Enhanced Universe System
export const universesTable = pgTable("universes", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  slug: varchar({ length: 100 }).notNull().unique(),
  hashtag: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  
  // Ownership & Moderation
  creatorId: uuid().notNull().references(() => usersTable.id),
  moderatorIds: json(),
  
  // Content
  coverImageId: uuid(),
  bannerImageId: uuid(),
  rules: json(),
  tags: json(),
  category: varchar({ length: 50 }),
  
  // Settings
  isPublic: boolean().default(false).notNull(),
  isNsfw: boolean().default(false).notNull(),
  requireApproval: boolean().default(false).notNull(),
  allowImages: boolean().default(true).notNull(),
  allowPolls: boolean().default(true).notNull(),
  minAgeRequirement: integer(),
  
  // Statistics
  memberCount: integer().default(0).notNull(),
  postCount: integer().default(0).notNull(),
  dailyActiveUsers: integer().default(0).notNull(),
  
  // Status
  isVerified: boolean().default(false).notNull(),
  isActive: boolean().default(true).notNull(),
  isFeatured: boolean().default(false).notNull(),
  isDeleted: boolean().default(false).notNull(),
  isClosed: boolean().default(false).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("universes_slug_idx").on(table.slug),
  creatorIdx: index("universes_creator_idx").on(table.creatorId),
  categoryIdx: index("universes_category_idx").on(table.category),
  memberCountIdx: index("universes_member_count_idx").on(table.memberCount),
}));

// Universe Memberships
export const universeMembersTable = pgTable("universe_members", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  userId: uuid().notNull(),

  // Member Status
  role: varchar({ length: 20 }).default('member').notNull(),
  isActive: boolean().default(true).notNull(),
  isBanned: boolean().default(false).notNull(),
  isMuted: boolean().default(false).notNull(),

  // Approval System
  status: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'approved', 'rejected'
  approvalNotes: text(),
  approvalBy: uuid(), // Moderator who approved/rejected
  approvalAt: timestamp(),
  requestMessage: text(),

  // Member Permissions
  permissions: json(),

  // Timestamps
  joinedAt: timestamp().defaultNow().notNull(),
  lastActivityAt: timestamp(),
  invitedBy: uuid(),
  
  // Member-specific settings
  notificationsEnabled: boolean().default(true).notNull(),
  nickname: varchar({ length: 50 }),
  customRole: varchar({ length: 50 }),

  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  universeUserUnique: unique().on(table.universeId, table.userId),
  universeIdx: index("universe_members_universe_idx").on(table.universeId),
  userIdx: index("universe_members_user_idx").on(table.userId),
  roleIdx: index("universe_members_role_idx").on(table.role),
  statusIdx: index("universe_members_status_idx").on(table.status),
  isActiveIdx: index("universe_members_active_idx").on(table.isActive),
}));

// Universe Join Requests
export const universeJoinRequestsTable = pgTable("universe_join_requests", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  userId: uuid().notNull(),
  message: text(),
  status: varchar({ length: 20 }).default('pending').notNull(),
  reviewedBy: uuid(),
  reviewedAt: timestamp(),
  reviewNotes: text(),
  requestedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  universeUserUnique: unique().on(table.universeId, table.userId),
  universeIdx: index("join_requests_universe_idx").on(table.universeId),
  userIdx: index("join_requests_user_idx").on(table.userId),
  statusIdx: index("join_requests_status_idx").on(table.status),
}));

// Type exports
export type Universe = typeof universesTable.$inferSelect;
export type NewUniverse = typeof universesTable.$inferInsert;
export type UniverseMember = typeof universeMembersTable.$inferSelect;
export type NewUniverseMember = typeof universeMembersTable.$inferInsert;
export type UniverseJoinRequest = typeof universeJoinRequestsTable.$inferSelect;
export type NewUniverseJoinRequest = typeof universeJoinRequestsTable.$inferInsert;