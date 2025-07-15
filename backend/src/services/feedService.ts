import { 
  getPersonalFeed, 
  getUniverseFeed, 
  getTrendingPosts, 
  getTrendingPostsOptimized, 
  FeedPost 
} from '../queries/feedQueries';
import { db } from '../db/connection';
import { 
  postsTable,
  postReactionsTable,
  usersTable,
  profilesTable,
  universesTable, 
  universeMembersTable, 
  mediaTable
} from '../db/Schemas';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
import fs from 'fs';

interface MediaData {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  dimensions: any;
}

export class FeedService {
  
  // Personal Feed mit Pagination
  static async getPersonalFeed(userId: string, page: number = 1, limit: number = 20, sortBy: string = 'newest') {
    try {
      const offset = (page - 1) * limit;

      const posts = await db
        .select({
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
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            profileImage: profilesTable.avatarId
          },
          universe: {
            id: universesTable.id,
            name: universesTable.name,
            slug: universesTable.slug
          },
          // Like-Status für aktuellen User
          isLikedByUser: sql<boolean>`CASE WHEN ${postReactionsTable.id} IS NOT NULL THEN true ELSE false END`
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id))
        .leftJoin(universeMembersTable, 
          and(
            eq(universeMembersTable.universeId, universesTable.id),
            eq(universeMembersTable.userId, userId)
          )
        )
        // Like-Status Join - immer ausführen da userId immer vorhanden
        .leftJoin(
          postReactionsTable,
          and(
            eq(postReactionsTable.postId, postsTable.id),
            eq(postReactionsTable.userId, userId),
            eq(postReactionsTable.reactionType, 'like')
          )
        )
        .where(
          and(
            eq(postsTable.isDeleted, false),
            eq(universeMembersTable.userId, userId),
            eq(universesTable.isDeleted, false),  // Keine Posts aus gelöschten Universes
            eq(universesTable.isClosed, false),   // Keine Posts aus geschlossenen Universes
            eq(universesTable.isActive, true)     // Nur Posts aus aktiven Universes
          )
        )
        .orderBy(sortBy === 'newest' ? desc(postsTable.createdAt) : asc(postsTable.createdAt))
        .offset(offset)
        .limit(limit);

      // console.log('✅ Personal Feed Service - Posts geladen:', posts.length);

      // Media-Daten für alle Posts laden
      const postsWithMedia = await Promise.all(
        posts.map(async (post) => {
          let mediaDataForFeed: MediaData[] = [];
          
          if (post.mediaIds && Array.isArray(post.mediaIds) && post.mediaIds.length > 0) {
            console.log('📸 FeedService: Loading media for personal post:', post.id, 'media IDs:', post.mediaIds);
            
            try {
              const mediaRecords = await db
                .select({
                  id: mediaTable.id,
                  url: mediaTable.url,
                  thumbnailUrl: mediaTable.thumbnailUrl,
                  filename: mediaTable.filename,
                  originalName: mediaTable.originalName,
                  mimeType: mediaTable.mimeType,
                  fileSize: mediaTable.fileSize,
                  dimensions: mediaTable.dimensions,
                  storagePath: mediaTable.storagePath
                })
                .from(mediaTable)
                .where(inArray(mediaTable.id, post.mediaIds));

              console.log('📸 FeedService: Media records for personal post', post.id, ':', mediaRecords.map(r => ({
                id: r.id,
                filename: r.filename,
                url: r.url,
                thumbnailUrl: r.thumbnailUrl,
                fileExists: r.storagePath ? fs.existsSync(r.storagePath) : false
              })));

              mediaDataForFeed = mediaRecords.map(record => ({
                id: record.id,
                url: record.url,
                thumbnailUrl: record.thumbnailUrl,
                filename: record.filename,
                originalName: record.originalName,
                mimeType: record.mimeType,
                fileSize: record.fileSize,
                dimensions: record.dimensions
              }));
              
              console.log('📸 FeedService: Processed media for personal post', post.id, ':', mediaDataForFeed.length, 'items');
              
            } catch (mediaError) {
              console.error('❌ FeedService: Error loading media for personal post', post.id, ':', mediaError);
            }
          }

          return {
            ...post,
            media: mediaDataForFeed
          };
        })
      );

      return {
        success: true,
        posts: postsWithMedia,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };

    } catch (error) {
      console.error('❌ Get personal feed error:', error);
      throw new Error('Failed to get personal feed');
    }
  }

  // Universe Feed
  static async getUniverseFeed(universeSlug: string, userId: string | null, page: number = 1, limit: number = 20, sortBy: string = 'newest') {
    try {
      const offset = (page - 1) * limit;

      // Query Builder
      let query = db
        .select({
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
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            profileImage: profilesTable.avatarId
          },
          universe: {
            id: universesTable.id,
            name: universesTable.name,
            slug: universesTable.slug
          },
          // Like-Status - immer einen Wert zurückgeben
          isLikedByUser: userId 
            ? sql<boolean>`CASE WHEN ${postReactionsTable.id} IS NOT NULL THEN true ELSE false END`
            : sql<boolean>`false`
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id));

      // Conditional Join nur wenn User eingeloggt ist
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

      // Where-Bedingungen und Order hinzufügen
      const posts = await query
        .where(
          and(
            eq(postsTable.isDeleted, false),
            eq(universesTable.slug, universeSlug),
            eq(postsTable.isPublic, true),
            eq(universesTable.isDeleted, false),  // Universe nicht gelöscht
            eq(universesTable.isClosed, false),   // Universe nicht geschlossen
            eq(universesTable.isActive, true)     // Universe ist aktiv
          )
        )
        .orderBy(sortBy === 'newest' ? desc(postsTable.createdAt) : asc(postsTable.createdAt))
        .offset(offset)
        .limit(limit);

      // console.log('✅ Universe Feed Service - Posts geladen:', posts.length);

      const postsWithMedia = await Promise.all(
        posts.map(async (post) => {
          let mediaDataForFeed: MediaData[] = [];
          
          if (post.mediaIds && Array.isArray(post.mediaIds) && post.mediaIds.length > 0) {
            console.log('📸 FeedService: Loading media for universe post:', post.id, 'media IDs:', post.mediaIds);
            
            try {
              const mediaRecords = await db
                .select({
                  id: mediaTable.id,
                  url: mediaTable.url,
                  thumbnailUrl: mediaTable.thumbnailUrl,
                  filename: mediaTable.filename,
                  originalName: mediaTable.originalName,
                  mimeType: mediaTable.mimeType,
                  fileSize: mediaTable.fileSize,
                  dimensions: mediaTable.dimensions,
                  storagePath: mediaTable.storagePath
                })
                .from(mediaTable)
                .where(inArray(mediaTable.id, post.mediaIds));

              console.log('📸 FeedService: Media records for universe post', post.id, ':', mediaRecords.map(r => ({
                id: r.id,
                filename: r.filename,
                url: r.url,
                thumbnailUrl: r.thumbnailUrl,
                fileExists: r.storagePath ? fs.existsSync(r.storagePath) : false
              })));

              mediaDataForFeed = mediaRecords.map(record => ({
                id: record.id,
                url: record.url,
                thumbnailUrl: record.thumbnailUrl,
                filename: record.filename,
                originalName: record.originalName,
                mimeType: record.mimeType,
                fileSize: record.fileSize,
                dimensions: record.dimensions
              }));
              
              console.log('📸 FeedService: Processed media for universe post', post.id, ':', mediaDataForFeed.length, 'items');
              
            } catch (mediaError) {
              console.error('❌ FeedService: Error loading media for universe post', post.id, ':', mediaError);
            }
          }

          return {
            ...post,
            media: mediaDataForFeed
          };
        })
      );

      return {
        success: true,
        posts: postsWithMedia,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };

    } catch (error) {
      console.error('❌ Get universe feed error:', error);
      throw new Error('Failed to get universe feed');
    }
  }

  // Trending Posts
  static async getTrendingFeed(
    timeframe = '7d', 
    limit = 20, 
    page = 1,
    userId?: string | null
  ) {
    try {
      const offset = (page - 1) * limit;

      console.log(`🔥 Loading trending feed:`, { timeframe, limit, page, userId: userId || 'anonymous' });

      // Verwende optimierte Query für bessere Performance
      const posts = await getTrendingPostsOptimized(timeframe, limit, offset, userId);

      console.log(`✅ Trending feed loaded:`, {
        postsCount: posts.length,
        timeframe,
        firstPostScore: posts[0] ? {
          likes: posts[0].likeCount,
          comments: posts[0].commentCount,
          shares: posts[0].shareCount
        } : null
      });

      // ✅ ERWEITERT: Media-Daten für alle Posts laden
      const postsWithMedia = await Promise.all(
        posts.map(async (post) => {
          let mediaDataForFeed: MediaData[] = [];
          
          if (post.mediaIds && Array.isArray(post.mediaIds) && post.mediaIds.length > 0) {
            console.log('📸 FeedService: Loading media for trending post:', post.id, 'media IDs:', post.mediaIds);
            
            try {
              const mediaRecords = await db
                .select({
                  id: mediaTable.id,
                  url: mediaTable.url,
                  thumbnailUrl: mediaTable.thumbnailUrl,
                  filename: mediaTable.filename,
                  originalName: mediaTable.originalName,
                  mimeType: mediaTable.mimeType,
                  fileSize: mediaTable.fileSize,
                  dimensions: mediaTable.dimensions,
                  storagePath: mediaTable.storagePath
                })
                .from(mediaTable)
                .where(inArray(mediaTable.id, post.mediaIds));

              console.log('📸 FeedService: Media records for trending post', post.id, ':', mediaRecords.map(r => ({
                id: r.id,
                filename: r.filename,
                url: r.url,
                thumbnailUrl: r.thumbnailUrl,
                fileExists: r.storagePath ? fs.existsSync(r.storagePath) : false
              })));

              mediaDataForFeed = mediaRecords.map(record => ({
                id: record.id,
                url: record.url,
                thumbnailUrl: record.thumbnailUrl,
                filename: record.filename,
                originalName: record.originalName,
                mimeType: record.mimeType,
                fileSize: record.fileSize,
                dimensions: record.dimensions
              }));
              
              console.log('📸 FeedService: Processed media for trending post', post.id, ':', mediaDataForFeed.length, 'items');
              
            } catch (mediaError) {
              console.error('❌ FeedService: Error loading media for trending post', post.id, ':', mediaError);
            }
          }

          return {
            ...post,
            media: mediaDataForFeed
          };
        })
      );

      return {
        success: true,
        posts: postsWithMedia,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };

    } catch (error) {
      console.error('❌ Get trending feed error:', error);
      throw new Error('Failed to fetch trending feed');
    }
  }

  // Alternative: Standard trending (falls optimierte Version Probleme macht)
  static async getTrendingFeedStandard(timeframe = '7d', limit = 10) {
    try {
      const posts = await getTrendingPosts(timeframe, limit);
      return { 
        success: true, 
        posts 
      };
    } catch (error) {
      console.error('Error fetching trending feed:', error);
      throw new Error('Failed to fetch trending feed');
    }
  }

  // Check if user follows universe
  static async isFollowingUniverse(userId: string, universeId: string): Promise<boolean> {
    try {
      const membership = await db
        .select()
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.userId, userId),
            eq(universeMembersTable.universeId, universeId)
          )
        )
        .limit(1);
      
      return membership.length > 0;
    } catch (error) {
      console.error('Error checking universe membership:', error);
      return false;
    }
  }
}