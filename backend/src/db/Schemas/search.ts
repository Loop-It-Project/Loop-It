import { 
  integer, 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  foreignKey,
  index
} from "drizzle-orm/pg-core";
import { usersTable } from './users';

// Search Index für optimierte Suche
export const searchIndexTable = pgTable("search_index", {
  id: uuid().primaryKey().defaultRandom(),
  entityType: varchar({ length: 50 }).notNull(),
  entityId: uuid().notNull(),
  
  // Searchable Content
  title: text(),
  content: text(),
  tags: json(),
  hashtags: json(),
  mentions: json(),
  
  // Search Metadata
  searchVector: text(),
  language: varchar({ length: 10 }).default('english').notNull(),
  
  // Relevance & Ranking
  popularityScore: integer().default(0).notNull(),
  recentnessScore: integer().default(0).notNull(),
  qualityScore: integer().default(0).notNull(),
  
  // Filtering
  isPublic: boolean().default(true).notNull(),
  isNsfw: boolean().default(false).notNull(),
  isActive: boolean().default(true).notNull(),
  universeId: uuid(),
  authorId: uuid(),
  
  // Geographic search
  location: json(),
  searchRadius: integer(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("search_entity_idx").on(table.entityType, table.entityId),
  searchVectorIdx: index("search_vector_idx").on(table.searchVector),
  universeIdx: index("search_universe_idx").on(table.universeId),
  authorIdx: index("search_author_idx").on(table.authorId),
  popularityIdx: index("search_popularity_idx").on(table.popularityScore),
  createdAtIdx: index("search_created_at_idx").on(table.createdAt),
}));

// Search History
export const searchHistoryTable = pgTable("search_history", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid(),
  sessionId: varchar({ length: 255 }),
  
  query: text().notNull(),
  normalizedQuery: text().notNull(),
  queryType: varchar({ length: 20 }).notNull(),
  
  filters: json(),
  sortBy: varchar({ length: 20 }),
  entityTypes: json(),
  
  resultCount: integer().notNull(),
  selectedResultId: uuid(),
  selectedResultRank: integer(),
  
  searchSource: varchar({ length: 50 }),
  userLocation: json(),
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdx: index("search_history_user_idx").on(table.userId),
  queryIdx: index("search_history_query_idx").on(table.normalizedQuery),
  createdAtIdx: index("search_history_created_at_idx").on(table.createdAt),
}));

// Search Suggestions
export const searchSuggestionsTable = pgTable("search_suggestions", {
  id: uuid().primaryKey().defaultRandom(),
  suggestionText: varchar({ length: 255 }).notNull().unique(),
  suggestionType: varchar({ length: 20 }).notNull(), // 'user', 'universe', 'hashtag', 'keyword'
  entityId: uuid(), // Reference to actual entity if applicable
  
  // Popularity metrics
  searchCount: integer().default(0).notNull(),
  clickCount: integer().default(0).notNull(),
  successRate: integer().default(0).notNull(), // Percentage of searches that found results
  
  // Autocomplete data
  aliases: json(), // Alternative spellings/names
  relatedTerms: json(), // Related search terms
  
  // Metadata
  category: varchar({ length: 50 }),
  isActive: boolean().default(true).notNull(),
  isPromoted: boolean().default(false).notNull(), // For sponsored suggestions
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  textIdx: index("suggestions_text_idx").on(table.suggestionText),
  typeIdx: index("suggestions_type_idx").on(table.suggestionType),
  popularityIdx: index("suggestions_popularity_idx").on(table.searchCount),
}));

// Search Filters Configuration
export const searchFiltersTable = pgTable("search_filters", {
  id: uuid().primaryKey().defaultRandom(),
  filterName: varchar({ length: 100 }).notNull().unique(),
  filterType: varchar({ length: 20 }).notNull(), // 'dropdown', 'checkbox', 'range', 'date'
  entityType: varchar({ length: 20 }).notNull(), // 'posts', 'users', 'universes'
  
  // Filter Options
  options: json(), // Available filter options
  defaultValue: json(),
  isMultiSelect: boolean().default(false).notNull(),
  
  // Display
  displayName: varchar({ length: 100 }).notNull(),
  description: text(),
  sortOrder: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("filters_name_idx").on(table.filterName),
  typeIdx: index("filters_type_idx").on(table.filterType),
  entityIdx: index("filters_entity_idx").on(table.entityType),
}));

// User Search Preferences
export const userSearchPreferencesTable = pgTable("user_search_preferences", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().unique(),
  
  // Default Search Settings
  defaultEntityTypes: json().default(['posts', 'users', 'universes']).notNull(),
  defaultSortBy: varchar({ length: 20 }).default('relevance').notNull(),
  defaultFilters: json(), // User's preferred default filters
  
  // Content Preferences
  includeNsfw: boolean().default(false).notNull(),
  preferredLanguages: json(), // ['en', 'de', 'es']
  blockedKeywords: json(), // Words to exclude from results
  
  // Privacy & Safety
  hideBlockedUsers: boolean().default(true).notNull(),
  showOnlyFriends: boolean().default(false).notNull(),
  limitToVerifiedContent: boolean().default(false).notNull(),
  
  // Geographic Preferences
  preferLocalContent: boolean().default(false).notNull(),
  maxDistance: integer(), // In kilometers
  preferredRegions: json(),
  
  // Advanced Settings
  searchHistory: boolean().default(true).notNull(), // Save search history
  personalizedResults: boolean().default(true).notNull(),
  trendingNotifications: boolean().default(true).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [usersTable.id],
  }),
}));

// Trending Topics
export const trendingTopicsTable = pgTable("trending_topics", {
  id: uuid().primaryKey().defaultRandom(),
  topic: varchar({ length: 100 }).notNull().unique(),
  topicType: varchar({ length: 20 }).notNull(), // 'hashtag', 'keyword', 'universe', 'user'
  
  // Popularity Metrics
  mentionCount: integer().default(0).notNull(),
  userCount: integer().default(0).notNull(),
  postCount: integer().default(0).notNull(),
  engagementScore: integer().default(0).notNull(),
  
  // Time-based Analytics
  hourlyMentions: json(), // Array of hourly mention counts
  dailyMentions: json(), // Array of daily mention counts
  peakHour: timestamp(),
  
  // Geographic & Categorization
  regions: json(), // Where this topic is trending
  isActive: boolean().default(true).notNull(),
  isFeatured: boolean().default(false).notNull(),
  category: varchar({ length: 50 }), // 'technology', 'sports', 'politics', etc.
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  topicIdx: index("trending_topics_topic_idx").on(table.topic),
  typeIdx: index("trending_topics_type_idx").on(table.topicType),
  engagementIdx: index("trending_topics_engagement_idx").on(table.engagementScore),
  categoryIdx: index("trending_topics_category_idx").on(table.category),
}));

// Type exports
export type SearchIndex = typeof searchIndexTable.$inferSelect;
export type NewSearchIndex = typeof searchIndexTable.$inferInsert;
export type SearchHistory = typeof searchHistoryTable.$inferSelect;
export type NewSearchHistory = typeof searchHistoryTable.$inferInsert;
export type TrendingTopic = typeof trendingTopicsTable.$inferSelect;
export type NewTrendingTopic = typeof trendingTopicsTable.$inferInsert;
export type SearchSuggestion = typeof searchSuggestionsTable.$inferSelect;
export type NewSearchSuggestion = typeof searchSuggestionsTable.$inferInsert;