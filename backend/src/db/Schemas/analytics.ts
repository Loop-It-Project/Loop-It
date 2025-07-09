import { 
  integer, 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  real,
  date,
  foreignKey,
  index
} from "drizzle-orm/pg-core";
import { searchHistoryTable } from './search';

// User Analytics & Metrics
export const userAnalyticsTable = pgTable("user_analytics", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  date: date().notNull(),
  
  // Activity Metrics
  loginCount: integer().default(0).notNull(),
  sessionDuration: integer().default(0).notNull(), // in minutes
  postsCreated: integer().default(0).notNull(),
  commentsCreated: integer().default(0).notNull(),
  likesGiven: integer().default(0).notNull(),
  likesReceived: integer().default(0).notNull(),
  sharesGiven: integer().default(0).notNull(),
  sharesReceived: integer().default(0).notNull(),
  
  // Navigation Metrics
  pagesViewed: integer().default(0).notNull(),
  universesVisited: integer().default(0).notNull(),
  searchesPerformed: integer().default(0).notNull(),
  
  // Engagement Metrics
  avgTimePerPost: real().default(0).notNull(), // seconds
  avgTimePerSession: real().default(0).notNull(), // minutes
  bounceRate: real().default(0).notNull(), // percentage
  
  // Device & Location
  deviceType: varchar({ length: 20 }), // 'desktop', 'mobile', 'tablet'
  browserType: varchar({ length: 50 }),
  location: json(), // { country, city, coordinates }
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("user_analytics_user_date_idx").on(table.userId, table.date),
  dateIdx: index("user_analytics_date_idx").on(table.date),
  userIdx: index("user_analytics_user_idx").on(table.userId),
}));

// Universe Analytics
export const universeAnalyticsTable = pgTable("universe_analytics", {
  id: uuid().primaryKey().defaultRandom(),
  universeId: uuid().notNull(),
  date: date().notNull(),
  
  // Activity Metrics
  newMembers: integer().default(0).notNull(),
  activeMembers: integer().default(0).notNull(),
  postsCreated: integer().default(0).notNull(),
  commentsCreated: integer().default(0).notNull(),
  totalEngagement: integer().default(0).notNull(), // likes + comments + shares
  
  // Growth Metrics
  memberGrowthRate: real().default(0).notNull(), // percentage
  postGrowthRate: real().default(0).notNull(),
  engagementRate: real().default(0).notNull(),
  
  // Content Quality
  avgPostLength: real().default(0).notNull(),
  avgCommentsPerPost: real().default(0).notNull(),
  avgLikesPerPost: real().default(0).notNull(),
  
  // Moderation Metrics
  reportsReceived: integer().default(0).notNull(),
  contentRemoved: integer().default(0).notNull(),
  membersWarned: integer().default(0).notNull(),
  membersBanned: integer().default(0).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  universeDateIdx: index("universe_analytics_universe_date_idx").on(table.universeId, table.date),
  dateIdx: index("universe_analytics_date_idx").on(table.date),
  universeIdx: index("universe_analytics_universe_idx").on(table.universeId),
}));

// System Analytics
export const systemAnalyticsTable = pgTable("system_analytics", {
  id: uuid().primaryKey().defaultRandom(),
  date: date().notNull(),
  
  // User Metrics
  totalUsers: integer().default(0).notNull(),
  activeUsers: integer().default(0).notNull(),
  newUsers: integer().default(0).notNull(),
  deletedUsers: integer().default(0).notNull(),
  
  // Content Metrics
  totalPosts: integer().default(0).notNull(),
  newPosts: integer().default(0).notNull(),
  deletedPosts: integer().default(0).notNull(),
  totalComments: integer().default(0).notNull(),
  newComments: integer().default(0).notNull(),
  
  // Universe Metrics
  totalUniverses: integer().default(0).notNull(),
  newUniverses: integer().default(0).notNull(),
  activeUniverses: integer().default(0).notNull(),
  
  // Engagement Metrics
  totalLikes: integer().default(0).notNull(),
  totalShares: integer().default(0).notNull(),
  totalSearches: integer().default(0).notNull(),
  
  // Performance Metrics
  avgResponseTime: real().default(0).notNull(), // milliseconds
  errorRate: real().default(0).notNull(), // percentage
  uptime: real().default(100).notNull(), // percentage
  
  // Moderation Metrics
  totalReports: integer().default(0).notNull(),
  resolvedReports: integer().default(0).notNull(),
  pendingReports: integer().default(0).notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("system_analytics_date_idx").on(table.date),
}));

// Event Tracking
export const eventTrackingTable = pgTable("event_tracking", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid(),
  sessionId: varchar({ length: 255 }),
  
  // Event Details
  eventType: varchar({ length: 50 }).notNull(), // 'page_view', 'click', 'post_create', etc.
  eventCategory: varchar({ length: 50 }).notNull(), // 'navigation', 'content', 'social', etc.
  eventAction: varchar({ length: 100 }).notNull(),
  eventLabel: varchar({ length: 200 }),
  eventValue: integer(), // numeric value for events
  
  // Context
  pageUrl: text(),
  referrer: text(),
  userAgent: text(),
  ipAddress: varchar({ length: 45 }),
  
  // Additional Data
  metadata: json(),
  customDimensions: json(),
  
  // Performance
  loadTime: integer(), // milliseconds
  timeOnPage: integer(), // seconds
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userIdx: index("event_tracking_user_idx").on(table.userId),
  sessionIdx: index("event_tracking_session_idx").on(table.sessionId),
  eventTypeIdx: index("event_tracking_event_type_idx").on(table.eventType),
  eventCategoryIdx: index("event_tracking_event_category_idx").on(table.eventCategory),
  createdAtIdx: index("event_tracking_created_at_idx").on(table.createdAt),
}));

// A/B Test Tracking
export const abTestsTable = pgTable("ab_tests", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  
  // Test Configuration
  startDate: timestamp().notNull(),
  endDate: timestamp(),
  isActive: boolean().default(true).notNull(),
  
  // Variants
  controlVariant: json().notNull(),
  testVariants: json().notNull(), // Array of variant configurations
  
  // Targeting
  targetAudience: json(), // User criteria
  trafficSplit: json().notNull(), // Percentage split between variants
  
  // Goals & Metrics
  primaryGoal: varchar({ length: 100 }).notNull(),
  secondaryGoals: json(),
  successMetrics: json(),
  
  // Results
  totalParticipants: integer().default(0).notNull(),
  conversionRate: real().default(0).notNull(),
  statisticalSignificance: real().default(0).notNull(),
  
  // Metadata
  createdBy: uuid().notNull(),
  status: varchar({ length: 20 }).default('draft').notNull(), // 'draft', 'running', 'paused', 'completed'
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("ab_tests_name_idx").on(table.name),
  statusIdx: index("ab_tests_status_idx").on(table.status),
  createdByIdx: index("ab_tests_created_by_idx").on(table.createdBy),
}));

// A/B Test Participants
export const abTestParticipantsTable = pgTable("ab_test_participants", {
  id: uuid().primaryKey().defaultRandom(),
  testId: uuid().notNull(),
  userId: uuid(),
  sessionId: varchar({ length: 255 }),
  
  // Assignment
  variant: varchar({ length: 50 }).notNull(),
  assignedAt: timestamp().defaultNow().notNull(),
  
  // Outcomes
  hasConverted: boolean().default(false).notNull(),
  convertedAt: timestamp(),
  conversionValue: real(), // monetary or other value
  
  // Metadata
  userAgent: text(),
  ipAddress: varchar({ length: 45 }),
  additionalData: json(),
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  testUserIdx: index("ab_test_participants_test_user_idx").on(table.testId, table.userId),
  testIdx: index("ab_test_participants_test_idx").on(table.testId),
  variantIdx: index("ab_test_participants_variant_idx").on(table.variant),
  convertedIdx: index("ab_test_participants_converted_idx").on(table.hasConverted),
}));

// Search Query Analtytics
export const searchQueryAnalyticsTable = pgTable("search_query_analytics", {
  id: uuid().primaryKey().defaultRandom(),
  originalQuery: text().notNull(),
  processedQuery: text().notNull(),
  
  // Query analysis
  queryTokens: json(), // Individual words/tokens
  queryIntent: varchar({ length: 50 }), // 'find_user', 'find_content', 'explore'
  detectedLanguage: varchar({ length: 10 }),
  sentiment: varchar({ length: 20 }), // 'positive', 'negative', 'neutral'
  
  // Performance metrics
  processingTimeMs: integer(),
  resultCount: integer(),
  averageRelevanceScore: integer(),
  
  // Corrections & suggestions
  suggestedCorrections: json(),
  didYouMean: varchar({ length: 255 }),
  
  date: timestamp().defaultNow().notNull(),
}, (table) => ({
  queryIdx: index("query_analytics_query_idx").on(table.originalQuery),
  intentIdx: index("query_analytics_intent_idx").on(table.queryIntent),
  dateIdx: index("query_analytics_date_idx").on(table.date),
}));

// Search Metrics Table
export const searchMetricsTable = pgTable("search_metrics", {
  id: uuid().primaryKey().defaultRandom(),
  date: timestamp().notNull(),
  hour: integer().notNull(), // Hour of the day (0-23)
  
  // Search Volume
  totalSearches: integer().default(0).notNull(),
  uniqueUsers: integer().default(0).notNull(),
  guestSearches: integer().default(0).notNull(),
  averageQueryLength: integer().default(0).notNull(),
  
  // Popular Content
  topQueries: json(), // Most searched queries
  newQueries: json(), // First-time searched queries
  failedQueries: json(), // Queries with no results
  
  // Performance
  averageResponseTime: integer().default(0).notNull(), // milliseconds
  averageResultCount: integer().default(0).notNull(),
  clickThroughRate: integer().default(0).notNull(), // percentage
  
  // User Behavior
  searchesPerUser: integer().default(0).notNull(),
  averageSessionSearches: integer().default(0).notNull(),
  bounceRate: integer().default(0).notNull(), // percentage
  
  // Content Analysis
  mostFoundContent: json(), // Content types that appear most in results
  popularFilters: json(), // Most used search filters
  popularCategories: json(), // Most searched categories
  
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  dateHourIdx: index("metrics_date_hour_idx").on(table.date, table.hour),
  dateIdx: index("metrics_date_idx").on(table.date),
}));

// Search Result Click Tracking
export const searchClicksTable = pgTable("search_clicks", {
  id: uuid().primaryKey().defaultRandom(),
  searchHistoryId: uuid().notNull(), // Reference to search_history
  userId: uuid(),
  sessionId: varchar({ length: 255 }),
  
  // Click Details
  resultType: varchar({ length: 20 }).notNull(), // 'post', 'user', 'universe'
  resultId: uuid().notNull(),
  resultRank: integer().notNull(), // Position in search results
  resultScore: integer(), // Relevance score of clicked result
  
  // Search Context
  query: text().notNull(),
  totalResults: integer().notNull(),
  appliedFilters: json(),
  
  // Timing
  searchTime: timestamp().notNull(),
  clickTime: timestamp().defaultNow().notNull(),
  timeToClick: integer(), // Milliseconds from search to click
  
  // Follow-up Actions
  subsequentActions: json(), // What user did after clicking
}, (table) => ({
  searchHistoryFk: foreignKey({
    columns: [table.searchHistoryId],
    foreignColumns: [searchHistoryTable.id],
  }),
  userIdx: index("clicks_user_idx").on(table.userId),
  resultIdx: index("clicks_result_idx").on(table.resultType, table.resultId),
  clickTimeIdx: index("clicks_time_idx").on(table.clickTime),
}));

// Type exports
export type UserAnalytics = typeof userAnalyticsTable.$inferSelect;
export type NewUserAnalytics = typeof userAnalyticsTable.$inferInsert;
export type UniverseAnalytics = typeof universeAnalyticsTable.$inferSelect;
export type NewUniverseAnalytics = typeof universeAnalyticsTable.$inferInsert;
export type SystemAnalytics = typeof systemAnalyticsTable.$inferSelect;
export type NewSystemAnalytics = typeof systemAnalyticsTable.$inferInsert;
export type EventTracking = typeof eventTrackingTable.$inferSelect;
export type NewEventTracking = typeof eventTrackingTable.$inferInsert;
export type ABTest = typeof abTestsTable.$inferSelect;
export type NewABTest = typeof abTestsTable.$inferInsert;
export type ABTestParticipant = typeof abTestParticipantsTable.$inferSelect;
export type NewABTestParticipant = typeof abTestParticipantsTable.$inferInsert;
export type SearchQueryAnalytics = typeof searchQueryAnalyticsTable.$inferSelect;
export type NewSearchQueryAnalytics = typeof searchQueryAnalyticsTable.$inferInsert;
export type SearchMetrics = typeof searchMetricsTable.$inferSelect;
export type NewSearchMetrics = typeof searchMetricsTable.$inferInsert;
export type SearchClick = typeof searchClicksTable.$inferSelect;
export type NewSearchClick = typeof searchClicksTable.$inferInsert;