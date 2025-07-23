import { db } from '../db/connection';
import { universesTable, postsTable, usersTable, searchHistoryTable } from '../db/Schemas';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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

interface SearchHistoryItem {
  id: string;
  query: string;
  queryType: string;
  resultCount: number;
  createdAt: Date;
}

export class SearchService {

  // Search History speichern
  static async saveSearchHistory(userId: string, query: string, queryType: string, resultCount: number) {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Prüfe ob identische Suche bereits existiert (in letzten 24h)
      const existingSearch = await db
        .select()
        .from(searchHistoryTable)
        .where(
          and(
            eq(searchHistoryTable.userId, userId),
            eq(searchHistoryTable.normalizedQuery, normalizedQuery),
            sql`${searchHistoryTable.createdAt} > NOW() - INTERVAL '24 hours'`
          )
        )
        .limit(1);

      if (existingSearch.length > 0) {
        // Update existing entry mit neuem Timestamp
        await db
          .update(searchHistoryTable)
          .set({
            resultCount,
            createdAt: new Date()
          })
          .where(eq(searchHistoryTable.id, existingSearch[0].id));
        
        return existingSearch[0].id;
      } else {
        // Neue History-Entry erstellen
        const historyId = uuidv4();
        await db
          .insert(searchHistoryTable)
          .values({
            id: historyId,
            userId,
            query,
            normalizedQuery,
            queryType,
            resultCount,
            searchSource: 'header_search',
            createdAt: new Date()
          });
        
        return historyId;
      }
    } catch (error) {
      console.error('❌ Error saving search history:', error);
      // Fehler nicht weiterwerfen - Search History ist optional
      return null;
    }
  }

  // Search History abrufen
  static async getSearchHistory(userId: string, limit: number = 10) {
    try {
      const history = await db
        .select({
          id: searchHistoryTable.id,
          query: searchHistoryTable.query,
          queryType: searchHistoryTable.queryType,
          resultCount: searchHistoryTable.resultCount,
          createdAt: searchHistoryTable.createdAt
        })
        .from(searchHistoryTable)
        .where(eq(searchHistoryTable.userId, userId))
        .orderBy(desc(searchHistoryTable.createdAt))
        .limit(limit);

      return history;
    } catch (error) {
      console.error('❌ Error fetching search history:', error);
      return [];
    }
  }

  // Search History Item löschen
  static async deleteSearchHistoryItem(userId: string, historyId: string) {
    try {
      await db
        .delete(searchHistoryTable)
        .where(
          and(
            eq(searchHistoryTable.id, historyId),
            eq(searchHistoryTable.userId, userId)
          )
        );
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting search history item:', error);
      return { success: false, error: 'Failed to delete search history item' };
    }
  }

  // Komplette Search History löschen
  static async clearSearchHistory(userId: string) {
    try {
      await db
        .delete(searchHistoryTable)
        .where(eq(searchHistoryTable.userId, userId));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing search history:', error);
      return { success: false, error: 'Failed to clear search history' };
    }
  }

  static async searchContent(searchQuery: any, userId?: string) {
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

      // Suche nach Hashtags
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

      // Search History speichern (falls User eingeloggt)
      if (userId && results.length > 0) {
        const queryType = query.startsWith('#') ? 'hashtag' : 'text';
        await this.saveSearchHistory(userId, query, queryType, results.length);
      }

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