export const searchQueries = {
  fullTextSearch: `
    SELECT si.*, p.title, p.content
    FROM search_index si
    JOIN posts p ON si.entity_id = p.id
    WHERE si.search_vector @@ plainto_tsquery('english', $1)
    ORDER BY ts_rank(si.search_vector, plainto_tsquery('english', $1)) DESC;
  `,
  
  geographicSearch: `
    SELECT si.*, ST_Distance(...) as distance
    FROM search_index si
    WHERE ST_DWithin(...);
  `,
  
  // Advanced Search Queries Examples:

// 1. Full-text search with filters
    searchPosts: `
  SELECT si.*, p.title, p.content, u.username as author_name
  FROM search_index si
  JOIN posts p ON si.entity_id = p.id
  JOIN users u ON p.author_id = u.id
  WHERE si.entity_type = 'post'
    AND si.search_vector @@ plainto_tsquery('english', $1)
    AND ($2::uuid IS NULL OR si.universe_id = $2)
    AND si.is_public = true
    AND si.is_active = true
  ORDER BY 
    ts_rank(si.search_vector, plainto_tsquery('english', $1)) DESC,
    si.popularity_score DESC
  LIMIT $3 OFFSET $4;
`,

// 2. Geographic search
    searchNearby: `
  SELECT si.*, 
    ST_Distance(
      ST_Point((si.location->>'lng')::float, (si.location->>'lat')::float)::geography,
      ST_Point($2::float, $3::float)::geography
    ) as distance
  FROM search_index si
  WHERE si.location IS NOT NULL
    AND ST_DWithin(
      ST_Point((si.location->>'lng')::float, (si.location->>'lat')::float)::geography,
      ST_Point($2::float, $3::float)::geography,
      $4 * 1000  -- Convert km to meters
    )
    AND ($1 = '' OR si.search_vector @@ plainto_tsquery('english', $1))
  ORDER BY distance, si.popularity_score DESC;
`,

// 3. Trending search
    searchTrending: `
  SELECT si.*, tt.engagement_score as trend_score
  FROM search_index si
  JOIN trending_topics tt ON si.tags::jsonb ? tt.topic OR si.hashtags::jsonb ? tt.topic
  WHERE si.created_at >= NOW() - INTERVAL '24 hours'
    AND tt.is_active = true
  ORDER BY tt.engagement_score DESC, si.popularity_score DESC
  LIMIT 50;
`,

// 4. Personalized search
    searchPersonalized: `
  WITH user_interests AS (
    SELECT jsonb_array_elements_text(interests) as interest
    FROM profiles WHERE user_id = $2
  ),
  friend_content AS (
    SELECT DISTINCT si.entity_id
    FROM search_index si
    JOIN friendships f ON (f.requester_id = $2 OR f.addressee_id = $2)
      AND f.status = 'accepted'
      AND si.author_id = CASE 
        WHEN f.requester_id = $2 THEN f.addressee_id 
        ELSE f.requester_id 
      END
    WHERE si.search_vector @@ plainto_tsquery('english', $1)
  )
  SELECT si.*, 
    CASE 
      WHEN si.entity_id IN (SELECT entity_id FROM friend_content) THEN 1.5
      WHEN EXISTS(SELECT 1 FROM user_interests ui WHERE si.tags::jsonb ? ui.interest) THEN 1.2
      ELSE 1.0
    END as personalization_boost
  FROM search_index si
  WHERE si.search_vector @@ plainto_tsquery('english', $1)
    AND si.is_public = true
  ORDER BY 
    ts_rank(si.search_vector, plainto_tsquery('english', $1)) * personalization_boost DESC
  LIMIT $3 OFFSET $4;
`,
};