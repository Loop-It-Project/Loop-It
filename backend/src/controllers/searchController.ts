import { Request, Response } from 'express';
import SearchService from '../services/searchService';
import { AuthRequest } from '../middleware/auth';

export const search = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // User-ID für Search History mitgeben
    const userId = req.user?.id;
    const results = await SearchService.searchContent(searchQuery, userId);

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

// Search History Endpoints
export const getSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const history = await SearchService.getSearchHistory(req.user.id, limit);
    
    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
};

export const deleteSearchHistoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { historyId } = req.params;
    const result = await SearchService.deleteSearchHistoryItem(req.user.id, historyId);
    
    if (result.success) {
      res.json({ success: true, message: 'Search history item deleted' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Delete search history item error:', error);
    res.status(500).json({ error: 'Failed to delete search history item' });
  }
};

export const clearSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await SearchService.clearSearchHistory(req.user.id);
    
    if (result.success) {
      res.json({ success: true, message: 'Search history cleared' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
};