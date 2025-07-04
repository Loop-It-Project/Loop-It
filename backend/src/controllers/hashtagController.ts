import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { db } from '../db/index';
import { universesTable } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const getUniverseByHashtag = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const { hashtag } = req.params;
    
    // Hashtag normalisieren (lowercase, ohne #)
    const normalizedHashtag = hashtag.toLowerCase().replace(/^#/, '');
    
    const universe = await db
      .select({
        id: universesTable.id,
        name: universesTable.name,
        slug: universesTable.slug,
        hashtag: universesTable.hashtag,
        description: universesTable.description,
        memberCount: universesTable.memberCount,
        isPublic: universesTable.isPublic,
        isActive: universesTable.isActive,
        createdAt: universesTable.createdAt,
      })
      .from(universesTable)
      .where(eq(universesTable.hashtag, normalizedHashtag))
      .limit(1);

    if (universe.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Universe for hashtag not found',
        hashtag: hashtag
      });
      return;
    }

    // Prüfe ob Universe öffentlich und aktiv ist
    const foundUniverse = universe[0];
    if (!foundUniverse.isPublic || !foundUniverse.isActive) {
      res.status(404).json({
        success: false,
        error: 'Universe is not accessible',
        hashtag: hashtag
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: foundUniverse.id,
        name: foundUniverse.name,
        slug: foundUniverse.slug,
        hashtag: foundUniverse.hashtag,
        description: foundUniverse.description,
        memberCount: foundUniverse.memberCount,
        createdAt: foundUniverse.createdAt,
      }
    });
  } catch (error) {
    console.error('Get universe by hashtag error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to find universe by hashtag' 
    });
  }
};

// Hashtag-Suche implementieren
export const searchHashtags = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
      return;
    }

    const hashtags = await db
      .select({
        hashtag: universesTable.hashtag,
        name: universesTable.name,
        slug: universesTable.slug,
        memberCount: universesTable.memberCount,
      })
      .from(universesTable)
      .where(
        and(
          eq(universesTable.isPublic, true),
          eq(universesTable.isActive, true),
          // Hashtag-Suche (case-insensitive)
          sql`${universesTable.hashtag} ILIKE ${`%${query.toLowerCase()}%`}`
        )
      )
      .orderBy(desc(universesTable.memberCount))
      .limit(10);

    res.status(200).json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    console.error('Search hashtags error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search hashtags' 
    });
  }
};