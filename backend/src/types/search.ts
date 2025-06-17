// Search API Helper Types
export interface SearchQuery {
  query: string;
  entityTypes?: ('posts' | 'users' | 'universes' | 'comments')[];
  filters?: {
    dateRange?: { start: Date; end: Date };
    universeId?: string;
    authorId?: string;
    tags?: string[];
    hashtags?: string[];
    location?: { lat: number; lng: number; radius: number };
    isNsfw?: boolean;
    language?: string;
    hasMedia?: boolean;
  };
  sortBy?: 'relevance' | 'date' | 'popularity' | 'engagement';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeAggregations?: boolean;
}

export interface SearchResult {
  results: SearchResultItem[];
  aggregations: {
    totalCount: number;
    entityCounts: Record<string, number>;
    facets: Record<string, FacetValue[]>;
    suggestions?: string[];
    didYouMean?: string;
  };
  performance: {
    queryTime: number;
    totalTime: number;
    resultsFound: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SearchResultItem {
  id: string;
  type: 'post' | 'user' | 'universe' | 'comment';
  title: string;
  content?: string;
  excerpt?: string;
  relevanceScore: number;
  highlights: Record<string, string[]>; // Highlighted text snippets
  metadata: {
    author?: { id: string; username: string; avatar?: string };
    universe?: { id: string; name: string; slug: string };
    createdAt: Date;
    tags?: string[];
    mediaCount?: number;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
}

export interface FacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  topicType: string;
  mentionCount: number;
  engagementScore: number;
  category?: string;
}