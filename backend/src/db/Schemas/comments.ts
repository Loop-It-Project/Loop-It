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

// Comments System
export const commentsTable = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull(),
  authorId: uuid().notNull(),
  parentId: uuid(),
  
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

// Comment Reactions
export const commentReactionsTable = pgTable("comment_reactions", {
  id: uuid().primaryKey().defaultRandom(),
  commentId: uuid().notNull(),
  userId: uuid().notNull(),
  reactionType: varchar({ length: 20 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  commentUserReactionUnique: unique().on(table.commentId, table.userId, table.reactionType),
  commentIdx: index("comment_reactions_comment_idx").on(table.commentId),
  userIdx: index("comment_reactions_user_idx").on(table.userId),
}));

// Type exports
export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;
export type CommentReaction = typeof commentReactionsTable.$inferSelect;
export type NewCommentReaction = typeof commentReactionsTable.$inferInsert;