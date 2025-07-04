import { db } from '../db/index';
import { 
  postsTable, 
  usersTable, 
  universesTable, 
  universeMembersTable,
  profilesTable,
  mediaTable 
} from '../db/schema';
import { eq, desc, asc, and, inArray, sql, isNull } from 'drizzle-orm';

export interface FeedPost {
  id: string;
  title: string | null;        
  content: string | null;      
  contentType: string;
  mediaIds: unknown;           
  hashtags: unknown;           
  tags: unknown;               
  universeId?: string;
  universeName?: string;
  universeSlug?: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null; 
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  isLikedByUser?: boolean;
}

// Helper function für Sortierung
const getSortOrder = (sortBy: string) => {
  switch (sortBy) {
    case 'oldest':
      return asc(postsTable.createdAt);
    case 'trending':
      return desc(
        sql`(${postsTable.likeCount} * 3 + ${postsTable.commentCount} * 2 + ${postsTable.shareCount} * 5)`
      );
    case 'newest':
    default:
      return desc(postsTable.createdAt);
  }
};

// Personal Feed - Posts aus gefolgten Universes
export const getPersonalFeed = async (
  userId: string, 
  limit = 20, 
  offset = 0,
  sortBy: string = 'newest'
): Promise<FeedPost[]> => {
  const query = db
    .select({
      // Post data
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      contentType: postsTable.contentType,
      mediaIds: postsTable.mediaIds,
      hashtags: postsTable.hashtags,
      tags: postsTable.tags,
      likeCount: postsTable.likeCount,
      commentCount: postsTable.commentCount,
      shareCount: postsTable.shareCount,
      createdAt: postsTable.createdAt,
      
      // Universe data
      universeId: universesTable.id,
      universeName: universesTable.name,
      universeSlug: universesTable.slug,
      
      // Author data
      authorId: usersTable.id,
      authorName: sql<string>`COALESCE(${usersTable.displayName}, CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName}))`,
      authorUsername: usersTable.username,
      authorAvatar: profilesTable.avatarId,
    })
    .from(postsTable)
    .innerJoin(universeMembersTable, eq(postsTable.universeId, universeMembersTable.universeId))
    .innerJoin(universesTable, eq(postsTable.universeId, universesTable.id))
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
    .where(
      and(
        eq(universeMembersTable.userId, userId), // User folgt diesem Universe
        eq(postsTable.isPublic, true),
        eq(postsTable.isDeleted, false),
        eq(universesTable.isActive, true)
      )
    )
    .orderBy(getSortOrder(sortBy))
    .limit(limit)
    .offset(offset);

  return await query;
};

// Universe Feed - Posts eines bestimmten Universe
export const getUniverseFeed = async (
  universeSlug: string, 
  userId?: string, 
  limit = 20, 
  offset = 0,
  sortBy: string = 'newest'
): Promise<FeedPost[]> => {
  const query = db
    .select({
      // Post data
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      contentType: postsTable.contentType,
      mediaIds: postsTable.mediaIds,
      hashtags: postsTable.hashtags,
      tags: postsTable.tags,
      likeCount: postsTable.likeCount,
      commentCount: postsTable.commentCount,
      shareCount: postsTable.shareCount,
      createdAt: postsTable.createdAt,
      
      // Universe data
      universeId: universesTable.id,
      universeName: universesTable.name,
      universeSlug: universesTable.slug,
      
      // Author data
      authorId: usersTable.id,
      authorName: sql<string>`COALESCE(${usersTable.displayName}, CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName}))`,
      authorUsername: usersTable.username,
      authorAvatar: profilesTable.avatarId,
    })
    .from(postsTable)
    .innerJoin(universesTable, eq(postsTable.universeId, universesTable.id))
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
    .where(
      and(
        eq(universesTable.slug, universeSlug),
        eq(postsTable.isPublic, true),
        eq(postsTable.isDeleted, false),
        eq(universesTable.isActive, true)
      )
    )
    .orderBy(getSortOrder(sortBy))
    .limit(limit)
    .offset(offset);

  return await query;
};

// Trending Posts (für später)
export const getTrendingPosts = async (timeframe = '24h', limit = 10): Promise<FeedPost[]> => {
  const timeCondition = timeframe === '24h' 
    ? sql`${postsTable.createdAt} >= NOW() - INTERVAL '24 hours'`
    : sql`${postsTable.createdAt} >= NOW() - INTERVAL '7 days'`;

  const query = db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      contentType: postsTable.contentType,
      mediaIds: postsTable.mediaIds,
      hashtags: postsTable.hashtags,
      tags: postsTable.tags,
      likeCount: postsTable.likeCount,
      commentCount: postsTable.commentCount,
      shareCount: postsTable.shareCount,
      createdAt: postsTable.createdAt,
      
      universeId: universesTable.id,
      universeName: universesTable.name,
      universeSlug: universesTable.slug,
      
      authorId: usersTable.id,
      authorName: sql<string>`COALESCE(${usersTable.displayName}, CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName}))`,
      authorUsername: usersTable.username,
      authorAvatar: profilesTable.avatarId,
    })
    .from(postsTable)
    .innerJoin(universesTable, eq(postsTable.universeId, universesTable.id))
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
    .where(
      and(
        timeCondition,
        eq(postsTable.isPublic, true),
        eq(postsTable.isDeleted, false)
      )
    )
    .orderBy(
      desc(
        sql`(${postsTable.likeCount} * 3 + ${postsTable.commentCount} * 2 + ${postsTable.shareCount} * 5)`
      )
    )
    .limit(limit);

  return await query;
};