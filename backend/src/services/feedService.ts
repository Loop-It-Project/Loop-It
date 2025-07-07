import { getPersonalFeed, getUniverseFeed, getTrendingPosts, FeedPost } from '../queries/feedQueries';
import { db } from '../db/index';
import { 
  postsTable,
  postReactionsTable,
  usersTable,
  profilesTable,
  universesTable, 
  universeMembersTable, 
} from '../db/schema';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';

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

      return {
        success: true,
        posts,
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

      return {
        success: true,
        posts,
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
  static async getTrendingFeed(timeframe = '24h', limit = 10) {
    try {
      const posts = await getTrendingPosts(timeframe, limit);
      return { posts };
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