import { db } from '../db/connection';
import { 
  postsTable, 
  usersTable, 
  universesTable, 
  universeMembersTable,
  profilesTable,
  mediaTable,
  postReactionsTable
} from '../db/Schemas';
import { eq, desc, asc, and, inArray, sql, isNull, gte } from 'drizzle-orm';

export interface FeedPost {
  id: string;
  title: string | null;        
  content: string | null;      
  contentType: string;
  mediaIds: unknown;           
  hashtags: unknown;              
  universeId?: string;
  universeName?: string;
  universeSlug?: string;
  authorId: string | null;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatar: string | null; 
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  isLikedByUser?: boolean;

  isPublic?: boolean;
  viewCount?: number;
  updatedAt?: Date;
  author?: {
    id: string | null;
    username: string | null;
    displayName: string | null;
    profileImage: string | null;
  };
  universe?: {
    id: string | null;
    name: string | null;
    slug: string | null;
  } | null;
  trendingScore?: number;
  tags?: unknown;
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

// Trending Posts
export const getTrendingPosts = async (
  timeframe = '7d', 
  limit = 20, 
  offset = 0,
  userId?: string | null
): Promise<FeedPost[]> => {
  
  // Zeitraum definieren
  const timeConditions = {
    '1h': sql`${postsTable.createdAt} >= NOW() - INTERVAL '1 hour'`,
    '6h': sql`${postsTable.createdAt} >= NOW() - INTERVAL '6 hours'`,
    '24h': sql`${postsTable.createdAt} >= NOW() - INTERVAL '24 hours'`,
    '7d': sql`${postsTable.createdAt} >= NOW() - INTERVAL '7 days'`,
    '30d': sql`${postsTable.createdAt} >= NOW() - INTERVAL '30 days'`
  };

  const timeCondition = timeConditions[timeframe as keyof typeof timeConditions] || timeConditions['7d'];

  // Erweiterte Trending-Score Berechnung
  // Likes = 3 Punkte, Comments = 5 Punkte, Shares = 10 Punkte
  // Plus Recency-Bonus (neuere Posts bekommen leichten Boost)
  const trendingScoreSQL = sql`
    (
      (${postsTable.likeCount} * 3) + 
      (${postsTable.commentCount} * 5) + 
      (${postsTable.shareCount} * 10) +
      (
        CASE 
          WHEN ${postsTable.createdAt} >= NOW() - INTERVAL '24 hours' THEN 20
          WHEN ${postsTable.createdAt} >= NOW() - INTERVAL '3 days' THEN 10
          WHEN ${postsTable.createdAt} >= NOW() - INTERVAL '7 days' THEN 5
          ELSE 0
        END
      )
    )
  `.as('trending_score');

  let query = db
    .select({
      // Post data
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      contentType: postsTable.contentType,
      mediaIds: postsTable.mediaIds,
      hashtags: postsTable.hashtags,
      isPublic: postsTable.isPublic,
      likeCount: postsTable.likeCount,
      commentCount: postsTable.commentCount,
      shareCount: postsTable.shareCount,
      viewCount: postsTable.viewCount,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,

      // Legacy Author data
      authorId: usersTable.id,
      authorName: usersTable.displayName,
      authorUsername: usersTable.username,
      authorAvatar: profilesTable.avatarId,

      // New Author Data
      author: {
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        profileImage: profilesTable.avatarId
      },

      // Universe data
      universe: {
        id: universesTable.id,
        name: universesTable.name,
        slug: universesTable.slug
      },
      // Like-Status für eingeloggten User
      isLikedByUser: userId 
        ? sql<boolean>`CASE WHEN ${postReactionsTable.id} IS NOT NULL THEN true ELSE false END`
        : sql<boolean>`false`,
      // Trending Score für Sortierung
      trendingScore: trendingScoreSQL
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
    .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id));

  // Like-Status Join nur wenn User eingeloggt
  if (userId) {
    query = query.leftJoin(
      postReactionsTable,
      and(
        eq(postReactionsTable.postId, postsTable.id),
        eq(postReactionsTable.userId, userId),
        eq(postReactionsTable.reactionType, 'like')
      )
    );
  }

  const results = await query
    .where(
      and(
        eq(postsTable.isDeleted, false),
        eq(postsTable.isPublic, true),
        eq(universesTable.isActive, true),
        eq(universesTable.isDeleted, false),
        eq(universesTable.isClosed, false),
        timeCondition,
        // Mindest-Engagement-Threshold
        sql`(${postsTable.likeCount} + ${postsTable.commentCount} + ${postsTable.shareCount}) >= 1`
      )
    )
    .orderBy(desc(trendingScoreSQL), desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

    // Transformiere Results zu FeedPost Format
  const posts: FeedPost[] = results.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentType: row.contentType,
    mediaIds: row.mediaIds as string[] | null,
    hashtags: row.hashtags as string[] | null,
    isPublic: row.isPublic,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    shareCount: row.shareCount,
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    
    // Legacy Author Felder
    authorId: row.authorId || '', // ✅ Fallback für den Fall dass doch null
    authorName: row.authorName || row.authorUsername || 'Unknown User',
    authorUsername: row.authorUsername || 'unknown',
    authorAvatar: row.authorAvatar,
    
    // Neue Author Struktur
    author: {
      id: row.author.id || '',
      username: row.author.username || 'unknown',
      displayName: row.author.displayName || row.author.username || 'Unknown User',
      profileImage: row.author.profileImage
    },
    
    // Universe Info
    universe: row.universe ? {
      id: row.universe.id || '',
      name: row.universe.name || 'Unknown Universe',
      slug: row.universe.slug || 'unknown'
    } : null,
    
    // User-spezifische Daten
    isLikedByUser: row.isLikedByUser,
    trendingScore: Number(row.trendingScore) || 0
  }));

  console.log(`✅ Trending Posts Query (${timeframe}):`, {
    postsFound: posts.length,
    timeframe,
    userId: userId || 'anonymous'
  });

  return posts;
};

// Trending Posts mit besserer Performance (falls die obige Query zu langsam ist)
export const getTrendingPostsOptimized = async (
  timeframe = '7d',
  limit = 20,
  offset = 0,
  userId?: string | null
): Promise<FeedPost[]> => {
  
  // Verwende Sub-Query für bessere Performance bei großen Datenmengen
  const timeConditions = {
    '1h': sql`${postsTable.createdAt} >= NOW() - INTERVAL '1 hour'`,
    '6h': sql`${postsTable.createdAt} >= NOW() - INTERVAL '6 hours'`,
    '24h': sql`${postsTable.createdAt} >= NOW() - INTERVAL '24 hours'`,
    '7d': sql`${postsTable.createdAt} >= NOW() - INTERVAL '7 days'`,
    '30d': sql`${postsTable.createdAt} >= NOW() - INTERVAL '30 days'`
  };

  const timeCondition = timeConditions[timeframe as keyof typeof timeConditions] || timeConditions['7d'];

  // Erst trending Post-IDs ermitteln
  const trendingPostIds = await db
    .select({
      id: postsTable.id,
      score: sql`
        (${postsTable.likeCount} * 3 + ${postsTable.commentCount} * 5 + ${postsTable.shareCount} * 10)
      `.as('score')
    })
    .from(postsTable)
    .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id))
    .where(
      and(
        eq(postsTable.isDeleted, false),
        eq(postsTable.isPublic, true),
        eq(universesTable.isActive, true),
        eq(universesTable.isDeleted, false),
        eq(universesTable.isClosed, false),
        timeCondition,
        sql`(${postsTable.likeCount} + ${postsTable.commentCount} + ${postsTable.shareCount}) >= 1`
      )
    )
    .orderBy(sql`score DESC`, desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (trendingPostIds.length === 0) {
    return [];
  }

  // Dann vollständige Post-Daten laden
  const postIds = trendingPostIds.map(p => p.id);
  
  let query = db
    .select({
      // Post data
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      contentType: postsTable.contentType,
      mediaIds: postsTable.mediaIds,
      hashtags: postsTable.hashtags,
      isPublic: postsTable.isPublic,
      likeCount: postsTable.likeCount,
      commentCount: postsTable.commentCount,
      shareCount: postsTable.shareCount,
      viewCount: postsTable.viewCount,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,

      // Legacy Author data
      authorId: usersTable.id,
      authorName: usersTable.displayName,
      authorUsername: usersTable.username,
      authorAvatar: profilesTable.avatarId,

      // new Author Data
      author: {
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        profileImage: profilesTable.avatarId
      },

      // Universe data
      universe: {
        id: universesTable.id,
        name: universesTable.name,
        slug: universesTable.slug
      },
      isLikedByUser: userId 
        ? sql<boolean>`CASE WHEN ${postReactionsTable.id} IS NOT NULL THEN true ELSE false END`
        : sql<boolean>`false`
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
    .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id));

  if (userId) {
    query = query.leftJoin(
      postReactionsTable,
      and(
        eq(postReactionsTable.postId, postsTable.id),
        eq(postReactionsTable.userId, userId),
        eq(postReactionsTable.reactionType, 'like')
      )
    );
  }

  const results = await query
    .where(inArray(postsTable.id, postIds));

  // Transformiere zu FeedPost Format und sortiere korrekt
  const postsMap = new Map<string, FeedPost>();

  results.forEach(row => {
    postsMap.set(row.id, {
      id: row.id,
      title: row.title,
      content: row.content,
      contentType: row.contentType,
      mediaIds: row.mediaIds,
      hashtags: row.hashtags,
      tags: row.hashtags,
      isPublic: row.isPublic,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      shareCount: row.shareCount,
      viewCount: row.viewCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      
      // Legacy Author Felder mit Null-Safety
      authorId: row.authorId || '',
      authorName: row.authorName || row.authorUsername || 'Unknown User',
      authorUsername: row.authorUsername || 'unknown',
      authorAvatar: row.authorAvatar,
      
      // Neue Struktur
      author: {
        id: row.author.id || '',
        username: row.author.username || 'unknown',
        displayName: row.author.displayName || row.author.username || 'Unknown User',
        profileImage: row.author.profileImage
      },
      
      universe: row.universe ? {
        id: row.universe.id || '',
        name: row.universe.name || 'Unknown Universe',
        slug: row.universe.slug || 'unknown'
      } : null,
      
      isLikedByUser: row.isLikedByUser
    });
  });

  // Posts in der gleichen Reihenfolge wie die trending IDs sortieren
  const sortedPosts = postIds
    .map(id => postsMap.get(id))
    .filter((post): post is FeedPost => post !== undefined);

  console.log(`✅ Trending Posts Optimized (${timeframe}):`, {
    postsFound: sortedPosts.length,
    timeframe,
    userId: userId || 'anonymous'
  });

  return sortedPosts as FeedPost[];
};