import { Request, Response } from 'express';
import SearchService from '../services/searchService';

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery = {
      query: req.query.q as string || '',
      entityTypes: req.query.types ? (req.query.types as string).split(',') as any : undefined,
      filters: {
        universeId: req.query.universeId as string,
        isNsfw: req.query.nsfw === 'true',
      },
      sortBy: req.query.sort as any || 'relevance',
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.size as string) || 20,
    };

    const results = await SearchService.searchContent(searchQuery);
    res.json(results);
  } catch (error) {
    console.error('Search controller error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

export const trending = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeframe = req.query.timeframe as string || '24h';
    const limit = parseInt(req.query.limit as string) || 10;

    const results = await SearchService.getTrending(timeframe, limit);
    res.json(results);
  } catch (error) {
    console.error('Trending controller error:', error);
    res.status(500).json({ error: 'Failed to get trending content' });
  }
};