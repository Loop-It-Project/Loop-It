import { db } from '../db/connection';
import { universesTable, postsTable, usersTable } from '../db/Schemas';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';

// Interfaces für die Typisierung
interface UniverseResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  hashtag: string | null;
  type: string;
}

interface HashtagResult {
  hashtag: string | null;
  universeSlug: string;
  universeName: string;
  memberCount: number;
  type: string;
}

export class SearchService {
  static async searchContent(searchQuery: any) {
    try {
      const { query, page = 1, pageSize = 20 } = searchQuery;
      const offset = (page - 1) * pageSize;

      if (!query || query.length < 2) {
        return {
          results: [],
          pagination: { page, pageSize, total: 0, hasMore: false }
        };
      }

      // Suche nach Universes
      const universes: UniverseResult[] = await db
        .select({
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug,
          description: universesTable.description,
          memberCount: universesTable.memberCount,
          hashtag: universesTable.hashtag,
          type: sql<string>`'universe'`
        })
        .from(universesTable)
        .where(
          and(
            eq(universesTable.isPublic, true),
            eq(universesTable.isActive, true),
            or(
              ilike(universesTable.name, `%${query}%`),
              ilike(universesTable.description, `%${query}%`),
              ilike(universesTable.hashtag, `%${query}%`)
            )
          )
        )
        .orderBy(desc(universesTable.memberCount))
        .limit(pageSize)
        .offset(offset);

      // ✅ KORRIGIERT - Expliziter Typ:
      let hashtags: HashtagResult[] = [];
      
      if (query.startsWith('#')) {
        const hashtagQuery = query.substring(1).toLowerCase();
        hashtags = await db
          .select({
            hashtag: universesTable.hashtag,
            universeSlug: universesTable.slug,
            universeName: universesTable.name,
            memberCount: universesTable.memberCount,
            type: sql<string>`'hashtag'`
          })
          .from(universesTable)
          .where(
            and(
              eq(universesTable.isPublic, true),
              eq(universesTable.isActive, true),
              ilike(universesTable.hashtag, `%${hashtagQuery}%`)
            )
          )
          .orderBy(desc(universesTable.memberCount))
          .limit(10);
      }

      // Kombiniere Ergebnisse
      const results = [...universes, ...hashtags];

      return {
        results,
        pagination: {
          page,
          pageSize,
          total: results.length,
          hasMore: results.length === pageSize
        }
      };
    } catch (error) {
      console.error('Search service error:', error);
      throw new Error('Search failed');
    }
  }

  // Rest bleibt gleich...
  static async getTrending(timeframe = '24h', limit = 10) {
    try {
      const universes: UniverseResult[] = await db
        .select({
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug,
          description: universesTable.description,
          memberCount: universesTable.memberCount,
          hashtag: universesTable.hashtag,
          type: sql<string>`'universe'`
        })
        .from(universesTable)
        .where(
          and(
            eq(universesTable.isPublic, true),
            eq(universesTable.isActive, true)
          )
        )
        .orderBy(desc(universesTable.memberCount))
        .limit(limit);

      return { results: universes };
    } catch (error) {
      console.error('Trending service error:', error);
      throw new Error('Failed to get trending content');
    }
  }
}

export default SearchService;