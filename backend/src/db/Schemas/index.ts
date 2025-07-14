// Central export file for all schema tables
import 'dotenv/config';

// Users & Authentication
export * from './users';
export * from './profiles';
export * from './roles';

// Content
export * from './media';
export * from './posts';
export * from './comments';
export * from './universes';

// Communication
export * from './conversations';
export * from './universeChat';

// System
export * from './moderation';
export * from './search';
export * from './analytics';

// Legacy (to be migrated)
export * from './legacy';

// Bug Reports
export * from './bugReports';

// Re-export common types aus den Modulen
export type {
  User,
  NewUser,
  RefreshToken,
  NewRefreshToken
} from './users';

export type {
  Profile,
  NewProfile,
  Friendship,
  NewFriendship
} from './profiles';

export type {
  Role,
  NewRole,
  UserRole,
  NewUserRole
} from './roles';

export type {
  Media,
  NewMedia
} from './media';

export type {
  Post,
  NewPost,
  PostReaction,
  NewPostReaction
} from './posts';

export type {
  Comment,
  NewComment,
  CommentReaction,
  NewCommentReaction
} from './comments';

export type {
  Universe,
  NewUniverse,
  UniverseMember,
  NewUniverseMember
} from './universes';

export type {
  Conversation,
  NewConversation,
  Message,
  NewMessage
} from './conversations';

export type {
  ModerationReport,
  NewModerationReport,
  ModerationAction,
  NewModerationAction,
  UserStrike,
  NewUserStrike,
  ModerationQueue,
  NewModerationQueue
} from './moderation';

export type {
  SearchIndex,
  NewSearchIndex,
  TrendingTopic, 
  NewTrendingTopic, 
  SearchSuggestion, 
  NewSearchSuggestion
} from './search';

export type {
  UserAnalytics,
  NewUserAnalytics,
  UniverseAnalytics,
  NewUniverseAnalytics,
  SystemAnalytics,
  NewSystemAnalytics,
  EventTracking,
  NewEventTracking,
  SearchQueryAnalytics,
  NewSearchQueryAnalytics,
  SearchMetrics,
  NewSearchMetrics, 
  SearchClick, 
  NewSearchClick 
} from './analytics';

export type {
  LegacyChatRoom,
  NewLegacyChatRoom,
  LegacyChatRoomMember,
  NewLegacyChatRoomMember,
  LegacyChatMessage,
  NewLegacyChatMessage,
  MessagesInChatRoom, 
  NewMessagesInChatRoom, 
  MigrationLog,
  NewMigrationLog
} from './legacy';

export type {
  UniverseChatRoom, 
  NewUniverseChatRoom, 
  UniverseChatMessage,  
  NewUniverseChatMessage,
  UniverseChatParticipant, 
  NewUniverseChatParticipant,
  UniverseChatModeration,
  NewUniverseChatModeration
} from './universeChat';

// Schema Overview Comment
/**
 * Loop-It Database Schema
 * 
 * This modular schema is organized into logical groups:
 * 
 * 🔐 Authentication: users.ts, roles.ts
 * 👤 Profiles: profiles.ts  
 * 📝 Content: posts.ts, comments.ts, media.ts
 * 🌌 Universes: universes.ts
 * 💬 Communication: conversations.ts
 * 🔍 Search: search.ts
 * 📊 Analytics: analytics.ts
 * 🛡️ Moderation: moderation.ts
 * 🏗️ Legacy: legacy.ts (old chat system)
 * 
 * Each module exports its tables and types independently.
 * 
 * TABLES OVERVIEW:
 * ================
 * 
 * USERS & AUTH (users.ts, profiles.ts, roles.ts):
 * - users, user_auth_tokens, user_sessions, user_verifications
 * - refresh_tokens, user_activities, profiles, friendships
 * - user_blocks, roles, user_roles
 * 
 * CONTENT (posts.ts, comments.ts, media.ts):
 * - posts, post_reactions, post_shares
 * - comments, comment_reactions
 * - media
 * 
 * UNIVERSES (universes.ts):
 * - universes, universe_members, universe_join_requests
 * 
 * COMMUNICATION (conversations.ts):
 * - conversations, conversation_participants, messages
 * 
 * MODERATION (moderation.ts):
 * - moderation_reports, moderation_actions, user_strikes
 * - moderation_queue, banned_patterns
 * 
 * ANALYTICS (analytics.ts):
 * - user_analytics, universe_analytics, system_analytics
 * - event_tracking, ab_tests, ab_test_participants
 * 
 * SEARCH (search.ts):
 * - search_index, search_history
 * 
 * LEGACY (legacy.ts):
 * - chat_rooms, chat_room_members, chat_messages, migration_log
 */