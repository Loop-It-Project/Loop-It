import { 
  integer, 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  index
} from "drizzle-orm/pg-core";

// Enhanced User System
export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp(),
  passwordHash: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 50 }).notNull().unique(),
  displayName: varchar({ length: 100 }),
  
  // Personal Information
  firstName: varchar({ length: 50 }),
  lastName: varchar({ length: 50 }),
  dateOfBirth: timestamp(),
  gender: varchar({ length: 20 }), // 'male', 'female', 'other', 'prefer_not_to_say'
  
  // Location & Privacy
  location: json(), // { country, city, coordinates: {lat, lng}, isPublic }
  searchRadius: integer().default(50).notNull(),
  locationVisibility: varchar({ length: 20 }).default('friends').notNull(),

  // Geo-Tracking Settings
  geoTrackingEnabled: boolean().default(false).notNull(),
  geoTrackingAccuracy: varchar({ length: 20 }).default('city').notNull(),
  autoUpdateLocation: boolean().default(false).notNull(),
  showDistanceToOthers: boolean().default(true).notNull(),
  maxSearchRadius: integer().default(100).notNull(),
  
  // Account Status
  accountStatus: varchar({ length: 20 }).default('active').notNull(),
  emailNotifications: boolean().default(true).notNull(),
  pushNotifications: boolean().default(true).notNull(),
  lastLoginAt: timestamp(),
  lastActivityAt: timestamp(),
  
  // Premium Features
  premiumTier: varchar({ length: 20 }).default('free').notNull(),
  premiumExpiresAt: timestamp(),
  
  // Timestamps
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
  lastActivityIdx: index("users_last_activity_idx").on(table.lastActivityAt),
}));

// Authentication Tokens
export const userAuthTokensTable = pgTable("user_auth_tokens", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  tokenType: varchar({ length: 50 }).notNull(),
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp().notNull(),
  usedAt: timestamp(),
  metadata: json(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("auth_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("auth_tokens_token_idx").on(table.token),
  expiresAtIdx: index("auth_tokens_expires_at_idx").on(table.expiresAt),
}));

// User Sessions
export const userSessionsTable = pgTable("user_sessions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  deviceInfo: json(),
  ipAddress: varchar({ length: 45 }),
  location: json(),
  isActive: boolean().default(true).notNull(),
  lastActivityAt: timestamp().defaultNow().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  lastActivityIdx: index("sessions_last_activity_idx").on(table.lastActivityAt),
}));

// User Verifications
export const userVerificationsTable = pgTable("user_verifications", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  verificationType: varchar({ length: 50 }).notNull(),
  isVerified: boolean().default(false).notNull(),
  verifiedAt: timestamp(),
  verifiedBy: uuid(),
  metadata: json(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_verifications_user_id_idx").on(table.userId),
  typeIdx: index("user_verifications_type_idx").on(table.verificationType),
}));

// Refresh Tokens
export const refreshTokensTable = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
}, (table) => ({
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
  expiresAtIdx: index('refresh_tokens_expires_at_idx').on(table.expiresAt),
}));

// Activity Tracking
export const userActivitiesTable = pgTable("user_activities", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  activityType: varchar({ length: 50 }).notNull(),
  entityType: varchar({ length: 50 }),
  entityId: uuid(),
  metadata: json(),
  ipAddress: varchar({ length: 45 }),
  userAgent: text(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdx: index("activities_user_idx").on(table.userId),
  typeIdx: index("activities_type_idx").on(table.activityType),
  entityIdx: index("activities_entity_idx").on(table.entityType, table.entityId),
  createdAtIdx: index("activities_created_at_idx").on(table.createdAt),
}));

// Type exports
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type NewRefreshToken = typeof refreshTokensTable.$inferInsert;
export type UserAuthToken = typeof userAuthTokensTable.$inferSelect;
export type NewUserAuthToken = typeof userAuthTokensTable.$inferInsert;
export type UserSession = typeof userSessionsTable.$inferSelect;
export type NewUserSession = typeof userSessionsTable.$inferInsert;
export type UserVerification = typeof userVerificationsTable.$inferSelect;
export type NewUserVerification = typeof userVerificationsTable.$inferInsert;
export type UserActivity = typeof userActivitiesTable.$inferSelect;
export type NewUserActivity = typeof userActivitiesTable.$inferInsert;