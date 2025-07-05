// Schema for Loop-It application using Drizzle ORM with PostgreSQL
// This schema includes tables for users, profiles, roles, posts, user pictures, private chats, chat rooms, messages in chat rooms, and universes.
// Loop-It/backend/src/db/schema.ts
import 'dotenv/config';
import { 
  integer, 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  jsonb,
  unique,
  foreignKey,
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
  locationVisibility: varchar({ length: 20 }).default('friends').notNull(), // 'public', 'friends', 'private'
  
  // Account Status
  accountStatus: varchar({ length: 20 }).default('active').notNull(), // 'active', 'suspended', 'banned', 'deleted'
  emailNotifications: boolean().default(true).notNull(),
  pushNotifications: boolean().default(true).notNull(),
  lastLoginAt: timestamp(),
  lastActivityAt: timestamp(),
  
  // Premium Features
  premiumTier: varchar({ length: 20 }).default('free').notNull(), // 'free', 'premium', 'pro'
  premiumExpiresAt: timestamp(),
  
  // Timestamps
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
  lastActivityIdx: index("users_last_activity_idx").on(table.lastActivityAt),
}));


// Multi-factor Authentication
export const userAuthTokensTable = pgTable("user_auth_tokens", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  tokenType: varchar({ length: 50 }).notNull(), // 'refresh', 'reset_password', 'email_verification', 'mfa'
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp().notNull(),
  usedAt: timestamp(),
  metadata: json(), // Device info, IP, etc.
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("auth_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("auth_tokens_token_idx").on(table.token),
  expiresAtIdx: index("auth_tokens_expires_at_idx").on(table.expiresAt),
}));


// User Sessions for device management
export const userSessionsTable = pgTable("user_sessions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  deviceInfo: json(), // { browser, os, device, userAgent }
  ipAddress: varchar({ length: 45 }),
  location: json(), // { country, city, timezone }
  isActive: boolean().default(true).notNull(),
  lastActivityAt: timestamp().defaultNow().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  lastActivityIdx: index("sessions_last_activity_idx").on(table.lastActivityAt),
}));


export const userVerificationsTable = pgTable("user_verifications", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  verificationType: varchar({ length: 50 }).notNull(), // 'email', 'phone', 'admin', 'id_card', etc.
  isVerified: boolean().default(false).notNull(),
  verifiedAt: timestamp(),
  verifiedBy: uuid(), // Admin user ID if applicable
  metadata: json(), // Additional verification data
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_verifications_user_id_idx").on(table.userId),
  typeIdx: index("user_verifications_type_idx").on(table.verificationType),
}));


// Enhanced Profiles
export const profilesTable = pgTable("profiles", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().unique(),
  
  // Profile Content
  bio: text(),
  motto: varchar({ length: 255 }),
  website: varchar({ length: 500 }),
  socialLinks: json(), // { instagram, twitter, linkedin, etc. }
  
  // Media
  avatarId: uuid(),
  coverImageId: uuid(),
  
  // Interests & Preferences
  interests: json(), // ["music", "sports", "technology", ...]
  hobbies: json(),
  languages: json(), // [{ code: "en", level: "native" }, ...]
  lookingFor: json(), // ["friends", "dating", "networking", ...]
  
  // Privacy Settings
  profileVisibility: varchar({ length: 20 }).default('public').notNull(),
  showAge: boolean().default(true).notNull(),
  showLocation: boolean().default(false).notNull(),
  allowMessagesFrom: varchar({ length: 20 }).default('everyone').notNull(), // 'everyone', 'friends', 'none'
  
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
  status: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'accepted', 'blocked', 'declined'
  requestedAt: timestamp().defaultNow().notNull(),
  respondedAt: timestamp(),
  notes: text(), // Private notes about the friend
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
  reason: varchar({ length: 100 }), // 'spam', 'harassment', 'inappropriate', 'other'
  notes: text(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  blockerBlockedUnique: unique().on(table.blockerId, table.blockedId),
  blockerIdx: index("user_blocks_blocker_idx").on(table.blockerId),
  blockedIdx: index("user_blocks_blocked_idx").on(table.blockedId),
}));


export const rolesTable = pgTable("roles", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 50 }).notNull().unique(),
  description: text(),
  permissions: json(), // Array von Permissions: ["read_posts", "create_universe", ...]
  isActive: boolean().default(true).notNull(),
  isDefault: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});


// Enhanced Media System
export const mediaTable = pgTable("media", {
  id: uuid().primaryKey().defaultRandom(),
  uploaderId: uuid().notNull(),
  
  // File Information
  originalName: varchar({ length: 255 }).notNull(),
  filename: varchar({ length: 255 }).notNull(),
  mimeType: varchar({ length: 100 }).notNull(),
  fileSize: integer().notNull(), // in bytes
  
  // URLs
  url: varchar({ length: 500 }).notNull(),
  thumbnailUrl: varchar({ length: 500 }),
  previewUrl: varchar({ length: 500 }), // For videos
  
  // Media Metadata
  dimensions: json(), // { width, height }
  duration: integer(), // For videos/audio in seconds
  quality: varchar({ length: 20 }), // 'low', 'medium', 'high', '4k'
  
  // Processing Status
  processingStatus: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  processingProgress: integer().default(0).notNull(), // 0-100
  
  // Storage Information
  storageProvider: varchar({ length: 50 }).default('local').notNull(), // 'local', 's3', 'cloudinary'
  storagePath: varchar({ length: 500 }),
  
  // Usage & Analytics
  downloadCount: integer().default(0).notNull(),
  viewCount: integer().default(0).notNull(),
  
  // Moderation
  isPublic: boolean().default(true).notNull(),
  isNsfw: boolean().default(false).notNull(),
  moderationStatus: varchar({ length: 20 }).default('approved').notNull(), // 'pending', 'approved', 'rejected'
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp(), // For temporary files
}, (table) => ({
  uploaderIdx: index("media_uploader_idx").on(table.uploaderId),
  filenameIdx: index("media_filename_idx").on(table.filename),
  mimeTypeIdx: index("media_mime_type_idx").on(table.mimeType),
  createdAtIdx: index("media_created_at_idx").on(table.createdAt),
}));


// Post Reactions (Likes, Hearts, etc.)
export const postReactionsTable = pgTable("post_reactions", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull(),
  userId: uuid().notNull(),
  reactionType: varchar({ length: 20 }).notNull(), // 'like', 'love', 'laugh', 'angry', 'sad'
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  postUserReactionUnique: unique().on(table.postId, table.userId, table.reactionType),
  postIdx: index("post_reactions_post_idx").on(table.postId),
  userIdx: index("post_reactions_user_idx").on(table.userId),
}));


// Comments System
export const commentsTable = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull(),
  authorId: uuid().notNull(),
  parentId: uuid(), // For nested comments
  
  content: text().notNull(),
  mediaIds: json(),
  mentions: json(),
  
  // Engagement
  likeCount: integer().default(0).notNull(),
  replyCount: integer().default(0).notNull(),
  
  // Moderation
  isDeleted: boolean().default(false).notNull(),
  isEdited: boolean().default(false).notNull(),
  editedAt: timestamp(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  postIdx: index("comments_post_idx").on(table.postId),
  authorIdx: index("comments_author_idx").on(table.authorId),
  parentIdx: index("comments_parent_idx").on(table.parentId),
  createdAtIdx: index("comments_created_at_idx").on(table.createdAt),
}));


// Enhanced Posts System
export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  authorId: uuid().notNull(),
  universeId: uuid(),
  
  // Content
  title: varchar({ length: 300 }),
  content: text(),
  contentType: varchar({ length: 20 }).default('text').notNull(), // 'text', 'image', 'video', 'poll', 'link'
  mediaIds: json(), // Array of media IDs
  
  // Link preview data
  linkUrl: varchar({ length: 1000 }),
  linkTitle: varchar({ length: 300 }),
  linkDescription: text(),
  linkImageUrl: varchar({ length: 500 }),
  
  // Organization
  tags: json(),
  mentions: json(), // Array of mentioned user IDs
  hashtags: json(),
  
  // Settings
  isPublic: boolean().default(true).notNull(),
  allowComments: boolean().default(true).notNull(),
  isNsfw: boolean().default(false).notNull(),
  isPinned: boolean().default(false).notNull(),
  isEdited: boolean().default(false).notNull(),
  editedAt: timestamp(),
  
  // Engagement
  viewCount: integer().default(0).notNull(),
  likeCount: integer().default(0).notNull(),
  commentCount: integer().default(0).notNull(),
  shareCount: integer().default(0).notNull(),
  
  // Moderation
  isDeleted: boolean().default(false).notNull(),
  deletedAt: timestamp(),
  deletedBy: uuid(),
  moderationNotes: text(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  authorIdx: index("posts_author_idx").on(table.authorId),
  universeIdx: index("posts_universe_idx").on(table.universeId),
  createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
  contentTypeIdx: index("posts_content_type_idx").on(table.contentType),
}));


export const conversationsTable = pgTable("conversations", {
  id: uuid().primaryKey().defaultRandom(),
  type: varchar({ length: 20 }).notNull(), // 'private', 'group', 'universe'
  name: varchar({ length: 255 }), // For group chats
  universeId: uuid(), // For universe chats
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
  role: varchar({ length: 20 }).default('member').notNull(), // 'admin', 'moderator', 'member'
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
  mediaId: uuid(), // Reference to media table
  messageType: varchar({ length: 20 }).default('text').notNull(), // 'text', 'image', 'file'
  replyToId: uuid(), // For threaded conversations
  editedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  isDeleted: boolean().default(false).notNull(),
}, (table) => ({
  conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  userIdIdx: index("messages_user_id_idx").on(table.userId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));


// Enhanced Universe System
export const universesTable = pgTable("universes", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  slug: varchar({ length: 100 }).notNull().unique(),
  hashtag: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  
  // Ownership & Moderation
  creatorId: uuid().notNull(),
  moderatorIds: json(), // Array of user IDs
  
  // Content
  coverImageId: uuid(),
  bannerImageId: uuid(),
  rules: json(), // Array of rule objects
  tags: json(),
  category: varchar({ length: 50 }), // 'technology', 'sports', 'music', etc.
  
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
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("universes_slug_idx").on(table.slug),
  creatorIdx: index("universes_creator_idx").on(table.creatorId),
  categoryIdx: index("universes_category_idx").on(table.category),
  memberCountIdx: index("universes_member_count_idx").on(table.memberCount),
}));


// Universe Memberships with roles
export const universeMembersTable = pgTable("universe_members", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  userId: uuid().notNull(),
  role: varchar({ length: 20 }).default('member').notNull(), // 'owner', 'admin', 'moderator', 'member', 'banned'
  permissions: json(), // Custom permissions array
  joinedAt: timestamp().defaultNow().notNull(),
  lastActivityAt: timestamp(),
  invitedBy: uuid(),
  
  // Member-specific settings
  notificationsEnabled: boolean().default(true).notNull(),
  nickname: varchar({ length: 50 }), // Universe-specific nickname
  customRole: varchar({ length: 50 }), // Custom role title

  // Timestamp für Updates
  updatedAt: timestamp().defaultNow().notNull(),
  
}, (table) => ({
  universeUserUnique: unique().on(table.universeId, table.userId),
  universeIdx: index("universe_members_universe_idx").on(table.universeId),
  userIdx: index("universe_members_user_idx").on(table.userId),
  roleIdx: index("universe_members_role_idx").on(table.role),
}));


// Universe Join Requests
export const universeJoinRequestsTable = pgTable("universe_join_requests", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  userId: uuid().notNull(),
  message: text(), // User's request message
  status: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'approved', 'rejected'
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


export const chatRoomsTable = pgTable("chat_rooms", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(), // Name of the chat room
    createdAt: timestamp().defaultNow().notNull(), // Assuming created at is stored as a timestamp in milliseconds
    creatorId: uuid().notNull(), // Foreign key to users table, assuming the creator is a user
    pictureId: uuid(), // Foreign key to user pictures table, optional
    description: varchar({ length: 1000 }), // Assuming a reasonable limit for room description
    universeId: uuid().notNull(), // Foreign key to universes table
}, (table) => ({
  creatorIdFk: foreignKey({
    columns: [table.creatorId],
    foreignColumns: [usersTable.id],
  }),
  universeIdFk: foreignKey({
    columns: [table.universeId],
    foreignColumns: [universesTable.id],
  }),
}));


export const messagesInChatRoomsTable = pgTable("messages_in_chat_rooms", {
    id: uuid().primaryKey().defaultRandom(),
    chatRoomId: uuid().notNull(), // Foreign key to chat rooms table
    message: varchar({ length: 1000 }), // Assuming a reasonable limit for chat room messages
    postedAt: timestamp().defaultNow().notNull(), // Assuming posted at is stored as a timestamp in milliseconds
    userId: uuid().notNull(), // Foreign key to users table
});


// User Activity Tracking
export const userActivitiesTable = pgTable("user_activities", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  activityType: varchar({ length: 50 }).notNull(), // 'login', 'post_created', 'comment_added', 'universe_joined'
  entityType: varchar({ length: 50 }), // 'post', 'comment', 'universe', 'user'
  entityId: uuid(),
  metadata: json(), // Additional activity data
  ipAddress: varchar({ length: 45 }),
  userAgent: text(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdx: index("activities_user_idx").on(table.userId),
  typeIdx: index("activities_type_idx").on(table.activityType),
  entityIdx: index("activities_entity_idx").on(table.entityType, table.entityId),
  createdAtIdx: index("activities_created_at_idx").on(table.createdAt),
}));


// Content Moderation
export const moderationReportsTable = pgTable("moderation_reports", {
  id: uuid().primaryKey().defaultRandom(),
  reporterId: uuid().notNull(),
  reportedContentType: varchar({ length: 50 }).notNull(), // 'post', 'comment', 'user', 'universe'
  reportedContentId: uuid().notNull(),
  reportedUserId: uuid(),
  reason: varchar({ length: 100 }).notNull(), // 'spam', 'harassment', 'inappropriate', 'copyright'
  description: text(),
  
  // Resolution
  status: varchar({ length: 20 }).default('pending').notNull(), // 'pending', 'reviewing', 'resolved', 'dismissed'
  reviewedBy: uuid(),
  reviewedAt: timestamp(),
  resolution: text(),
  actionTaken: varchar({ length: 100 }), // 'content_removed', 'user_warned', 'user_banned', 'no_action'
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index("reports_reporter_idx").on(table.reporterId),
  contentIdx: index("reports_content_idx").on(table.reportedContentType, table.reportedContentId),
  statusIdx: index("reports_status_idx").on(table.status),
  createdAtIdx: index("reports_created_at_idx").on(table.createdAt),
}));


// Search Index Table für optimierte Suche
export const searchIndexTable = pgTable("search_index", {
  id: uuid().primaryKey().defaultRandom(),
  entityType: varchar({ length: 50 }).notNull(), // 'user', 'post', 'universe', 'comment'
  entityId: uuid().notNull(),
  
  // Searchable Content
  title: text(), // Post title, username, universe name
  content: text(), // Post content, bio, description
  tags: json(), // Array of tags
  hashtags: json(), // Array of hashtags
  mentions: json(), // Array of mentioned users
  
  // Search Metadata
  searchVector: text(), // PostgreSQL tsvector for full-text search
  language: varchar({ length: 10 }).default('english').notNull(),
  
  // Relevance & Ranking
  popularityScore: integer().default(0).notNull(), // Based on likes, views, etc.
  recentnessScore: integer().default(0).notNull(), // Time-based scoring
  qualityScore: integer().default(0).notNull(), // Content quality metrics
  
  // Filtering
  isPublic: boolean().default(true).notNull(),
  isNsfw: boolean().default(false).notNull(),
  isActive: boolean().default(true).notNull(),
  universeId: uuid(), // For universe-specific searches
  authorId: uuid(), // Content author
  
  // Geographic search
  location: json(), // { lat, lng, country, city }
  searchRadius: integer(), // In kilometers
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("search_entity_idx").on(table.entityType, table.entityId),
  searchVectorIdx: index("search_vector_idx").on(table.searchVector), // GIN index for PostgreSQL
  universeIdx: index("search_universe_idx").on(table.universeId),
  authorIdx: index("search_author_idx").on(table.authorId),
  popularityIdx: index("search_popularity_idx").on(table.popularityScore),
  createdAtIdx: index("search_created_at_idx").on(table.createdAt),
}));


// Search History für personalisierte Ergebnisse
export const searchHistoryTable = pgTable("search_history", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid(),
  sessionId: varchar({ length: 255 }), // For anonymous users
  
  // Search Query
  query: text().notNull(),
  normalizedQuery: text().notNull(), // Lowercase, trimmed, standardized
  queryType: varchar({ length: 20 }).notNull(), // 'text', 'tag', 'user', 'universe', 'location'
  
  // Search Filters
  filters: json(), // Applied filters
  sortBy: varchar({ length: 20 }), // 'relevance', 'date', 'popularity'
  entityTypes: json(), // ['posts', 'users', 'universes']
  
  // Results
  resultCount: integer().notNull(),
  selectedResultId: uuid(), // Which result was clicked
  selectedResultRank: integer(), // Position in search results
  
  // Context
  searchSource: varchar({ length: 50 }), // 'header', 'discover', 'universe'
  userLocation: json(), // User's location at search time
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdx: index("search_history_user_idx").on(table.userId),
  queryIdx: index("search_history_query_idx").on(table.normalizedQuery),
  createdAtIdx: index("search_history_created_at_idx").on(table.createdAt),
}));


// Trending Topics & Hashtags
export const trendingTopicsTable = pgTable("trending_topics", {
  id: uuid().primaryKey().defaultRandom(),
  topic: varchar({ length: 100 }).notNull().unique(),
  topicType: varchar({ length: 20 }).notNull(), // 'hashtag', 'keyword', 'entity'
  
  // Metrics
  mentionCount: integer().default(0).notNull(),
  userCount: integer().default(0).notNull(), // Unique users mentioning
  postCount: integer().default(0).notNull(),
  engagementScore: integer().default(0).notNull(),
  
  // Time-based metrics
  hourlyMentions: json(), // Last 24 hours data
  dailyMentions: json(), // Last 30 days data
  peakHour: timestamp(),
  
  // Geographic data
  regions: json(), // Where it's trending
  
  // Status
  isActive: boolean().default(true).notNull(),
  isFeatured: boolean().default(false).notNull(),
  category: varchar({ length: 50 }), // 'technology', 'sports', 'entertainment'
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  topicIdx: index("trending_topics_topic_idx").on(table.topic),
  typeIdx: index("trending_topics_type_idx").on(table.topicType),
  engagementIdx: index("trending_topics_engagement_idx").on(table.engagementScore),
  categoryIdx: index("trending_topics_category_idx").on(table.category),
}));


// Search Suggestions
export const searchSuggestionsTable = pgTable("search_suggestions", {
  id: uuid().primaryKey().defaultRandom(),
  suggestionText: varchar({ length: 255 }).notNull().unique(),
  suggestionType: varchar({ length: 20 }).notNull(), // 'user', 'universe', 'hashtag', 'keyword'
  entityId: uuid(), // Reference to actual entity if applicable
  
  // Popularity metrics
  searchCount: integer().default(0).notNull(),
  clickCount: integer().default(0).notNull(),
  successRate: integer().default(0).notNull(), // Percentage of searches that found results
  
  // Autocomplete data
  aliases: json(), // Alternative spellings/names
  relatedTerms: json(), // Related search terms
  
  // Metadata
  category: varchar({ length: 50 }),
  isActive: boolean().default(true).notNull(),
  isPromoted: boolean().default(false).notNull(), // For sponsored suggestions
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  textIdx: index("suggestions_text_idx").on(table.suggestionText),
  typeIdx: index("suggestions_type_idx").on(table.suggestionType),
  popularityIdx: index("suggestions_popularity_idx").on(table.searchCount),
}));


// Search Query Preprocessing
export const searchQueryAnalyticsTable = pgTable("search_query_analytics", {
  id: uuid().primaryKey().defaultRandom(),
  originalQuery: text().notNull(),
  processedQuery: text().notNull(),
  
  // Query analysis
  queryTokens: json(), // Individual words/tokens
  queryIntent: varchar({ length: 50 }), // 'find_user', 'find_content', 'explore'
  detectedLanguage: varchar({ length: 10 }),
  sentiment: varchar({ length: 20 }), // 'positive', 'negative', 'neutral'
  
  // Performance metrics
  processingTimeMs: integer(),
  resultCount: integer(),
  averageRelevanceScore: integer(),
  
  // Corrections & suggestions
  suggestedCorrections: json(),
  didYouMean: varchar({ length: 255 }),
  
  date: timestamp().defaultNow().notNull(),
}, (table) => ({
  queryIdx: index("query_analytics_query_idx").on(table.originalQuery),
  intentIdx: index("query_analytics_intent_idx").on(table.queryIntent),
  dateIdx: index("query_analytics_date_idx").on(table.date),
}));


// Search Filters Configuration
export const searchFiltersTable = pgTable("search_filters", {
  id: uuid().primaryKey().defaultRandom(),
  filterName: varchar({ length: 100 }).notNull().unique(),
  filterType: varchar({ length: 20 }).notNull(), // 'dropdown', 'checkbox', 'range', 'date'
  entityType: varchar({ length: 20 }).notNull(), // 'posts', 'users', 'universes'
  
  // Filter Options
  options: json(), // Available filter options
  defaultValue: json(),
  isMultiSelect: boolean().default(false).notNull(),
  
  // Display
  displayName: varchar({ length: 100 }).notNull(),
  description: text(),
  sortOrder: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("filters_name_idx").on(table.filterName),
  typeIdx: index("filters_type_idx").on(table.filterType),
  entityIdx: index("filters_entity_idx").on(table.entityType),
}));


// User Search Preferences
export const userSearchPreferencesTable = pgTable("user_search_preferences", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().unique(),
  
  // Default Search Settings
  defaultEntityTypes: json().default(['posts', 'users', 'universes']).notNull(),
  defaultSortBy: varchar({ length: 20 }).default('relevance').notNull(),
  defaultFilters: json(), // User's preferred default filters
  
  // Content Preferences
  includeNsfw: boolean().default(false).notNull(),
  preferredLanguages: json(), // ['en', 'de', 'es']
  blockedKeywords: json(), // Words to exclude from results
  
  // Privacy & Safety
  hideBlockedUsers: boolean().default(true).notNull(),
  showOnlyFriends: boolean().default(false).notNull(),
  limitToVerifiedContent: boolean().default(false).notNull(),
  
  // Geographic Preferences
  preferLocalContent: boolean().default(false).notNull(),
  maxDistance: integer(), // In kilometers
  preferredRegions: json(),
  
  // Advanced Settings
  searchHistory: boolean().default(true).notNull(), // Save search history
  personalizedResults: boolean().default(true).notNull(),
  trendingNotifications: boolean().default(true).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [usersTable.id],
  }),
}));


// Search Performance Metrics
export const searchMetricsTable = pgTable("search_metrics", {
  id: uuid().primaryKey().defaultRandom(),
  date: timestamp().notNull(),
  hour: integer().notNull(), // 0-23 for hourly analytics
  
  // Volume Metrics
  totalSearches: integer().default(0).notNull(),
  uniqueUsers: integer().default(0).notNull(),
  guestSearches: integer().default(0).notNull(),
  
  // Query Metrics
  averageQueryLength: integer().default(0).notNull(),
  topQueries: json(), // Most popular queries
  newQueries: json(), // Queries not seen before
  failedQueries: json(), // Queries with no results
  
  // Performance Metrics
  averageResponseTime: integer().default(0).notNull(), // In milliseconds
  averageResultCount: integer().default(0).notNull(),
  clickThroughRate: integer().default(0).notNull(), // Percentage
  
  // User Behavior
  searchesPerUser: integer().default(0).notNull(),
  averageSessionSearches: integer().default(0).notNull(),
  bounceRate: integer().default(0).notNull(), // Users who search once and leave
  
  // Content Metrics
  mostFoundContent: json(), // Most frequently found in results
  popularFilters: json(), // Most used filters
  popularCategories: json(),
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  dateHourIdx: index("metrics_date_hour_idx").on(table.date, table.hour),
  dateIdx: index("metrics_date_idx").on(table.date),
}));


// Search Result Click Tracking
export const searchClicksTable = pgTable("search_clicks", {
  id: uuid().primaryKey().defaultRandom(),
  searchHistoryId: uuid().notNull(), // Reference to search_history
  userId: uuid(),
  sessionId: varchar({ length: 255 }),
  
  // Clicked Result
  resultType: varchar({ length: 20 }).notNull(), // 'post', 'user', 'universe'
  resultId: uuid().notNull(),
  resultRank: integer().notNull(), // Position in search results (1-based)
  resultScore: integer(), // Relevance score
  
  // Context
  query: text().notNull(),
  totalResults: integer().notNull(),
  appliedFilters: json(),
  searchTime: timestamp().notNull(),
  
  // User Action
  clickTime: timestamp().defaultNow().notNull(),
  timeToClick: integer(), // Milliseconds from search to click
  subsequentActions: json(), // What user did after clicking
  
}, (table) => ({
  searchHistoryFk: foreignKey({
    columns: [table.searchHistoryId],
    foreignColumns: [searchHistoryTable.id],
  }),
  userIdx: index("clicks_user_idx").on(table.userId),
  resultIdx: index("clicks_result_idx").on(table.resultType, table.resultId),
  clickTimeIdx: index("clicks_time_idx").on(table.clickTime),
}));

// Refresh Tokens Table
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
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 support
}, (table) => ({
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
  expiresAtIdx: index('refresh_tokens_expires_at_idx').on(table.expiresAt),
}));

// Comment Reactions Table hinzufügen
export const commentReactionsTable = pgTable("comment_reactions", {
  id: uuid().primaryKey().defaultRandom(),
  commentId: uuid().notNull(),
  userId: uuid().notNull(),
  reactionType: varchar({ length: 20 }).notNull(), // 'like', 'love', 'laugh', 'angry', 'sad'
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  commentUserReactionUnique: unique().on(table.commentId, table.userId, table.reactionType),
  commentIdx: index("comment_reactions_comment_idx").on(table.commentId),
  userIdx: index("comment_reactions_user_idx").on(table.userId),
}));

// Post Shares Table hinzufügen
export const postSharesTable = pgTable("post_shares", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull(),
  userId: uuid(), // Kann null sein für anonyme Shares
  shareType: varchar({ length: 50 }).notNull(), // 'internal', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy_link'
  sharedTo: varchar({ length: 100 }), // Platform-spezifische Info
  metadata: json(), // Zusätzliche Share-Daten
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  postIdx: index("post_shares_post_idx").on(table.postId),
  userIdx: index("post_shares_user_idx").on(table.userId),
  typeIdx: index("post_shares_type_idx").on(table.shareType),
  createdAtIdx: index("post_shares_created_at_idx").on(table.createdAt),
}));

// Export all tables for use in the application
export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type NewRefreshToken = typeof refreshTokensTable.$inferInsert;

// Schema Overview
// This schema defines the structure of the Loop-It application database using Drizzle ORM with PostgreSQL.
// It includes tables for users, profiles, roles, posts, user pictures, private chats, chat rooms, messages in chat rooms, and universes.