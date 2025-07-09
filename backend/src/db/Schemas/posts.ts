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

// Enhanced Posts System
export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  authorId: uuid().notNull(),
  universeId: uuid(),
  
  // Content
  title: varchar({ length: 300 }),
  content: text(),
  contentType: varchar({ length: 20 }).default('text').notNull(),
  mediaIds: json(),
  
  // Link preview data
  linkUrl: varchar({ length: 1000 }),
  linkTitle: varchar({ length: 300 }),
  linkDescription: text(),
  linkImageUrl: varchar({ length: 500 }),
  
  // Organization
  tags: json(),
  mentions: json(),
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

// Post Reactions
export const postReactionsTable = pgTable("post_reactions", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull(),
  userId: uuid().notNull(),
  reactionType: varchar({ length: 20 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  postUserReactionUnique: unique().on(table.postId, table.userId, table.reactionType),
  postIdx: index("post_reactions_post_idx").on(table.postId),
  userIdx: index("post_reactions_user_idx").on(table.userId),
}));

// Post Shares
export const postSharesTable = pgTable("post_shares", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull(),
  userId: uuid(),
  shareType: varchar({ length: 50 }).notNull(),
  sharedTo: varchar({ length: 100 }),
  metadata: json(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  postIdx: index("post_shares_post_idx").on(table.postId),
  userIdx: index("post_shares_user_idx").on(table.userId),
  typeIdx: index("post_shares_type_idx").on(table.shareType),
  createdAtIdx: index("post_shares_created_at_idx").on(table.createdAt),
}));

// Type exports
export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;
export type PostReaction = typeof postReactionsTable.$inferSelect;
export type NewPostReaction = typeof postReactionsTable.$inferInsert;
export type PostShare = typeof postSharesTable.$inferSelect;
export type NewPostShare = typeof postSharesTable.$inferInsert;