// src/services/searchService.ts - VERVOLLSTÄNDIGEN:
import { db } from '../db';
import { searchIndexTable, trendingTopicsTable } from '../db/schema';
import { searchQueries } from '../queries/searchQueries';
import type { SearchQuery, SearchResult } from '../types/search';
import { eq, and, desc, sql } from 'drizzle-orm';

export class SearchService {
  async searchContent(query: SearchQuery): Promise<SearchResult> {
    try {
      const { 
        query: searchText, 
        entityTypes = ['posts', 'users', 'universes'], 
        filters = {},
        sortBy = 'relevance',
        page = 1,
        pageSize = 20 
      } = query;

      // Build WHERE conditions
      const conditions = [
        sql`search_vector @@ plainto_tsquery('english', ${searchText})`,
        eq(searchIndexTable.isActive, true),
        eq(searchIndexTable.isPublic, true)
      ];

      if (filters.universeId) {
        conditions.push(eq(searchIndexTable.universeId, filters.universeId));
      }

      if (filters.isNsfw !== undefined) {
        conditions.push(eq(searchIndexTable.isNsfw, filters.isNsfw));
      }

      // Execute search
      const results = await db
        .select()
        .from(searchIndexTable)
        .where(and(...conditions))
        .orderBy(
          sortBy === 'relevance' 
            ? desc(sql`ts_rank(search_vector, plainto_tsquery('english', ${searchText}))`)
            : desc(searchIndexTable.createdAt)
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Format results
      return {
        results: results.map(this.formatSearchResult),
        aggregations: {
          totalCount: results.length,
          entityCounts: {},
          facets: {}
        },
        performance: {
          queryTime: 0, // Implement timing
          totalTime: 0,
          resultsFound: results.length
        },
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(results.length / pageSize),
          hasNext: results.length === pageSize,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  private formatSearchResult = (item: any) => ({
    id: item.entityId,
    type: item.entityType,
    title: item.title || '',
    content: item.content || '',
    relevanceScore: 0, // Calculate from search vector
    highlights: {},
    metadata: {
      createdAt: item.createdAt,
      tags: item.tags || [],
    }
  });

  async getTrendingTopics() {
    return await db
      .select()
      .from(trendingTopicsTable)
      .where(eq(trendingTopicsTable.isActive, true))
      .orderBy(desc(trendingTopicsTable.engagementScore))
      .limit(10);
  }
}

export default SearchService;