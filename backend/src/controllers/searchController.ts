// src/controllers/searchController.ts
import { Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import type { SearchQuery } from '../types/search';

export class SearchController {
  private searchService = new SearchService();

  async search(req: Request, res: Response) {
    try {
      const searchQuery: SearchQuery = {
        query: req.query.q as string || '',
        entityTypes: req.query.types ? (req.query.types as string).split(',') as any : undefined,
        filters: {
          universeId: req.query.universeId as string,
          isNsfw: req.query.nsfw === 'true',
          // ... weitere Filter
        },
        sortBy: req.query.sort as any || 'relevance',
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.size as string) || 20,
      };

      const results = await this.searchService.searchContent(searchQuery);
      res.json(results);
    } catch (error) {
      console.error('Search controller error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  async trending(req: Request, res: Response) {
    try {
      const topics = await this.searchService.getTrendingTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get trending topics' });
    }
  }
}