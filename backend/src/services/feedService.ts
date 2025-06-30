import { getPersonalFeed, getUniverseFeed, getTrendingPosts, FeedPost } from '../queries/feedQueries';
import { db } from '../db/index';
import { universeMembersTable, universesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class FeedService {
  
  // Personal Feed mit Pagination
  static async getPersonalFeed(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    try {
      const posts = await getPersonalFeed(userId, limit, offset);
      
      return {
        posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };
    } catch (error) {
      console.error('Error fetching personal feed:', error);
      throw new Error('Failed to fetch personal feed');
    }
  }

  // Universe Feed
  static async getUniverseFeed(universeSlug: string, userId?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    try {
      const posts = await getUniverseFeed(universeSlug, userId, limit, offset);
      
      // Check if user is member of this universe
      let isMember = false;
      if (userId) {
        const membership = await db
          .select()
          .from(universeMembersTable)
          .innerJoin(universesTable, eq(universeMembersTable.universeId, universesTable.id))
          .where(
            and(
              eq(universeMembersTable.userId, userId),
              eq(universesTable.slug, universeSlug)
            )
          )
          .limit(1);
        
        isMember = membership.length > 0;
      }
      
      return {
        posts,
        isMember,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };
    } catch (error) {
      console.error('Error fetching universe feed:', error);
      throw new Error('Failed to fetch universe feed');
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