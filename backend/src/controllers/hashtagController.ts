export const getUniverseByHashtag = async (req: Request, res: Response) => {
  try {
    const { hashtag } = req.params;
    
    const universe = await db
      .select({
        id: universesTable.id,
        name: universesTable.name,
        slug: universesTable.slug,
        hashtag: universesTable.hashtag,
        description: universesTable.description,
        memberCount: universesTable.memberCount,
      })
      .from(universesTable)
      .where(eq(universesTable.hashtag, hashtag.toLowerCase()))
      .limit(1);

    if (universe.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Universe for hashtag not found',
        hashtag: hashtag
      });
    }

    res.status(200).json({
      success: true,
      data: universe[0]
    });
  } catch (error) {
    console.error('Get universe by hashtag error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to find universe by hashtag' 
    });
  }
};