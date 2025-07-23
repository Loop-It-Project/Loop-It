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

// User Profiles
export const profilesTable = pgTable("profiles", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().unique(),
  
  // Profile Content
  bio: text(),
  motto: varchar({ length: 255 }),
  website: varchar({ length: 500 }),
  socialLinks: json(),
  
  // Media
  avatarId: uuid(),
  coverImageId: uuid(),
  
  // Interests & Preferences
  interests: json(),
  hobbies: json(),
  languages: json(),
  lookingFor: json(),
  
  // Privacy Settings
  profileVisibility: varchar({ length: 20 }).default('public').notNull(),
  showAge: boolean().default(true).notNull(),
  showLocation: boolean().default(false).notNull(),
  allowMessagesFrom: varchar({ length: 20 }).default('everyone').notNull(),
  
  // Statistics
  profileViews: integer().default(0).notNull(),
  friendsCount: integer().default(0).notNull(),
  postsCount: integer().default(0).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [usersTable.id],
  }),
}));

// Friend System
export const friendshipsTable = pgTable("friendships", {
  id: uuid().primaryKey().defaultRandom(),
  requesterId: uuid().notNull(),
  addresseeId: uuid().notNull(),
  status: varchar({ length: 20 }).default('pending').notNull(),
  requestedAt: timestamp().defaultNow().notNull(),
  respondedAt: timestamp(),
  notes: text(),
  metadata: json().$type<{[key: string]: any} | null>(),
}, (table) => ({
  requesterAddresseeUnique: unique().on(table.requesterId, table.addresseeId),
  requesterIdx: index("friendships_requester_idx").on(table.requesterId),
  addresseeIdx: index("friendships_addressee_idx").on(table.addresseeId),
  statusIdx: index("friendships_status_idx").on(table.status),
}));

// User Blocking System
export const userBlocksTable = pgTable("user_blocks", {
  id: uuid().primaryKey().defaultRandom(),
  blockerId: uuid().notNull(),
  blockedId: uuid().notNull(),
  reason: varchar({ length: 100 }),
  notes: text(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  blockerBlockedUnique: unique().on(table.blockerId, table.blockedId),
  blockerIdx: index("user_blocks_blocker_idx").on(table.blockerId),
  blockedIdx: index("user_blocks_blocked_idx").on(table.blockedId),
}));

// Type exports
export type Profile = typeof profilesTable.$inferSelect;
export type NewProfile = typeof profilesTable.$inferInsert;
export type Friendship = typeof friendshipsTable.$inferSelect;
export type NewFriendship = typeof friendshipsTable.$inferInsert;
export type UserBlock = typeof userBlocksTable.$inferSelect;
export type NewUserBlock = typeof userBlocksTable.$inferInsert;