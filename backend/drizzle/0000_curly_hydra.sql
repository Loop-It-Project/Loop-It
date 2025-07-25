CREATE TYPE "public"."bug_category" AS ENUM('ui', 'functionality', 'performance', 'security', 'data', 'other');--> statement-breakpoint
CREATE TYPE "public"."bug_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."bug_status" AS ENUM('open', 'in_progress', 'resolved', 'closed', 'duplicate', 'invalid');--> statement-breakpoint
CREATE TABLE "search_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filterName" varchar(100) NOT NULL,
	"filterType" varchar(20) NOT NULL,
	"entityType" varchar(20) NOT NULL,
	"options" json,
	"defaultValue" json,
	"isMultiSelect" boolean DEFAULT false NOT NULL,
	"displayName" varchar(100) NOT NULL,
	"description" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_filters_filterName_unique" UNIQUE("filterName")
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"sessionId" varchar(255),
	"query" text NOT NULL,
	"normalizedQuery" text NOT NULL,
	"queryType" varchar(20) NOT NULL,
	"filters" json,
	"sortBy" varchar(20),
	"entityTypes" json,
	"resultCount" integer NOT NULL,
	"selectedResultId" uuid,
	"selectedResultRank" integer,
	"searchSource" varchar(50) DEFAULT 'header_search',
	"userLocation" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_index" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entityType" varchar(50) NOT NULL,
	"entityId" uuid NOT NULL,
	"title" text,
	"content" text,
	"tags" json,
	"hashtags" json,
	"mentions" json,
	"searchVector" text,
	"language" varchar(10) DEFAULT 'english' NOT NULL,
	"popularityScore" integer DEFAULT 0 NOT NULL,
	"recentnessScore" integer DEFAULT 0 NOT NULL,
	"qualityScore" integer DEFAULT 0 NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"universeId" uuid,
	"authorId" uuid,
	"location" json,
	"searchRadius" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suggestionText" varchar(255) NOT NULL,
	"suggestionType" varchar(20) NOT NULL,
	"entityId" uuid,
	"searchCount" integer DEFAULT 0 NOT NULL,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"successRate" integer DEFAULT 0 NOT NULL,
	"aliases" json,
	"relatedTerms" json,
	"category" varchar(50),
	"isActive" boolean DEFAULT true NOT NULL,
	"isPromoted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_suggestions_suggestionText_unique" UNIQUE("suggestionText")
);
--> statement-breakpoint
CREATE TABLE "trending_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(100) NOT NULL,
	"topicType" varchar(20) NOT NULL,
	"mentionCount" integer DEFAULT 0 NOT NULL,
	"userCount" integer DEFAULT 0 NOT NULL,
	"postCount" integer DEFAULT 0 NOT NULL,
	"engagementScore" integer DEFAULT 0 NOT NULL,
	"hourlyMentions" json,
	"dailyMentions" json,
	"peakHour" timestamp,
	"regions" json,
	"isActive" boolean DEFAULT true NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"category" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trending_topics_topic_unique" UNIQUE("topic")
);
--> statement-breakpoint
CREATE TABLE "user_search_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"defaultEntityTypes" json DEFAULT '["posts","users","universes"]'::json NOT NULL,
	"defaultSortBy" varchar(20) DEFAULT 'relevance' NOT NULL,
	"defaultFilters" json,
	"includeNsfw" boolean DEFAULT false NOT NULL,
	"preferredLanguages" json,
	"blockedKeywords" json,
	"hideBlockedUsers" boolean DEFAULT true NOT NULL,
	"showOnlyFriends" boolean DEFAULT false NOT NULL,
	"limitToVerifiedContent" boolean DEFAULT false NOT NULL,
	"preferLocalContent" boolean DEFAULT false NOT NULL,
	"maxDistance" integer,
	"preferredRegions" json,
	"searchHistory" boolean DEFAULT true NOT NULL,
	"personalizedResults" boolean DEFAULT true NOT NULL,
	"trendingNotifications" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_search_preferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	"user_agent" text,
	"ip_address" varchar(45),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"activityType" varchar(50) NOT NULL,
	"entityType" varchar(50),
	"entityId" uuid,
	"metadata" json,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"tokenType" varchar(50) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"deviceInfo" json,
	"ipAddress" varchar(45),
	"location" json,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastActivityAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"verificationType" varchar(50) NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verifiedAt" timestamp,
	"verifiedBy" uuid,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"emailVerifiedAt" timestamp,
	"passwordHash" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"displayName" varchar(100),
	"firstName" varchar(50),
	"lastName" varchar(50),
	"dateOfBirth" timestamp,
	"gender" varchar(20),
	"location" json,
	"searchRadius" integer DEFAULT 50 NOT NULL,
	"locationVisibility" varchar(20) DEFAULT 'friends' NOT NULL,
	"geoTrackingEnabled" boolean DEFAULT false NOT NULL,
	"geoTrackingAccuracy" varchar(20) DEFAULT 'city' NOT NULL,
	"autoUpdateLocation" boolean DEFAULT false NOT NULL,
	"showDistanceToOthers" boolean DEFAULT true NOT NULL,
	"maxSearchRadius" integer DEFAULT 100 NOT NULL,
	"accountStatus" varchar(20) DEFAULT 'active' NOT NULL,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"pushNotifications" boolean DEFAULT true NOT NULL,
	"lastLoginAt" timestamp,
	"lastActivityAt" timestamp,
	"premiumTier" varchar(20) DEFAULT 'free' NOT NULL,
	"premiumExpiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requesterId" uuid NOT NULL,
	"addresseeId" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp,
	"notes" text,
	"metadata" json,
	CONSTRAINT "friendships_requesterId_addresseeId_unique" UNIQUE("requesterId","addresseeId")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"bio" text,
	"motto" varchar(255),
	"website" varchar(500),
	"socialLinks" json,
	"avatarId" uuid,
	"coverImageId" uuid,
	"interests" json,
	"hobbies" json,
	"languages" json,
	"lookingFor" json,
	"profileVisibility" varchar(20) DEFAULT 'public' NOT NULL,
	"showAge" boolean DEFAULT true NOT NULL,
	"showLocation" boolean DEFAULT false NOT NULL,
	"allowMessagesFrom" varchar(20) DEFAULT 'everyone' NOT NULL,
	"profileViews" integer DEFAULT 0 NOT NULL,
	"friendsCount" integer DEFAULT 0 NOT NULL,
	"postsCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blockerId" uuid NOT NULL,
	"blockedId" uuid NOT NULL,
	"reason" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_blocks_blockerId_blockedId_unique" UNIQUE("blockerId","blockedId")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"permissions" json,
	"isActive" boolean DEFAULT true NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"assignedBy" uuid,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_userId_roleId_unique" UNIQUE("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaderId" uuid NOT NULL,
	"originalName" varchar(255) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mimeType" varchar(100) NOT NULL,
	"fileSize" integer NOT NULL,
	"url" varchar(500) NOT NULL,
	"thumbnailUrl" varchar(500),
	"previewUrl" varchar(500),
	"dimensions" json,
	"duration" integer,
	"quality" varchar(20),
	"processingStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"processingProgress" integer DEFAULT 0 NOT NULL,
	"storageProvider" varchar(50) DEFAULT 'local' NOT NULL,
	"storagePath" varchar(500),
	"downloadCount" integer DEFAULT 0 NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"moderationStatus" varchar(20) DEFAULT 'approved' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"reactionType" varchar(20) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_reactions_postId_userId_reactionType_unique" UNIQUE("postId","userId","reactionType")
);
--> statement-breakpoint
CREATE TABLE "post_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"userId" uuid,
	"shareType" varchar(50) NOT NULL,
	"sharedTo" varchar(100),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorId" uuid NOT NULL,
	"universeId" uuid,
	"title" varchar(300),
	"content" text,
	"contentType" varchar(20) DEFAULT 'text' NOT NULL,
	"mediaIds" json,
	"linkUrl" varchar(1000),
	"linkTitle" varchar(300),
	"linkDescription" text,
	"linkImageUrl" varchar(500),
	"tags" json,
	"mentions" json,
	"hashtags" json,
	"isPublic" boolean DEFAULT true NOT NULL,
	"allowComments" boolean DEFAULT true NOT NULL,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isEdited" boolean DEFAULT false NOT NULL,
	"editedAt" timestamp,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"shareCount" integer DEFAULT 0 NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	"moderationNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commentId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"reactionType" varchar(20) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_reactions_commentId_userId_reactionType_unique" UNIQUE("commentId","userId","reactionType")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"parentId" uuid,
	"content" text NOT NULL,
	"mediaIds" json,
	"mentions" json,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"replyCount" integer DEFAULT 0 NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"isEdited" boolean DEFAULT false NOT NULL,
	"editedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universe_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewedBy" uuid,
	"reviewedAt" timestamp,
	"reviewNotes" text,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universe_join_requests_universeId_userId_unique" UNIQUE("universeId","userId")
);
--> statement-breakpoint
CREATE TABLE "universe_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isBanned" boolean DEFAULT false NOT NULL,
	"isMuted" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approvalNotes" text,
	"approvalBy" uuid,
	"approvalAt" timestamp,
	"requestMessage" text,
	"permissions" json,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastActivityAt" timestamp,
	"invitedBy" uuid,
	"notificationsEnabled" boolean DEFAULT true NOT NULL,
	"nickname" varchar(50),
	"customRole" varchar(50),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universe_members_universeId_userId_unique" UNIQUE("universeId","userId")
);
--> statement-breakpoint
CREATE TABLE "universes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"hashtag" varchar(100) NOT NULL,
	"description" text,
	"creatorId" uuid NOT NULL,
	"moderatorIds" json,
	"coverImageId" uuid,
	"bannerImageId" uuid,
	"rules" json,
	"tags" json,
	"category" varchar(50),
	"isPublic" boolean DEFAULT false NOT NULL,
	"isNsfw" boolean DEFAULT false NOT NULL,
	"requireApproval" boolean DEFAULT false NOT NULL,
	"allowImages" boolean DEFAULT true NOT NULL,
	"allowPolls" boolean DEFAULT true NOT NULL,
	"minAgeRequirement" integer,
	"memberCount" integer DEFAULT 0 NOT NULL,
	"postCount" integer DEFAULT 0 NOT NULL,
	"dailyActiveUsers" integer DEFAULT 0 NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"isClosed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "universes_hashtag_unique" UNIQUE("hashtag")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user1Id" uuid NOT NULL,
	"user2Id" uuid NOT NULL,
	"matchedAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"conversationId" uuid,
	"matchQuality" integer DEFAULT 0 NOT NULL,
	"commonInterests" json,
	"lastInteraction" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	CONSTRAINT "matches_user1Id_user2Id_unique" UNIQUE("user1Id","user2Id")
);
--> statement-breakpoint
CREATE TABLE "swipe_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"swiperId" uuid NOT NULL,
	"targetId" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"context" json,
	CONSTRAINT "swipe_actions_swiperId_targetId_unique" UNIQUE("swiperId","targetId")
);
--> statement-breakpoint
CREATE TABLE "swipe_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"maxDistance" integer DEFAULT 50 NOT NULL,
	"minAge" integer DEFAULT 18 NOT NULL,
	"maxAge" integer DEFAULT 99 NOT NULL,
	"showMe" varchar(20) DEFAULT 'everyone' NOT NULL,
	"requireCommonInterests" boolean DEFAULT false NOT NULL,
	"minCommonInterests" integer DEFAULT 1 NOT NULL,
	"excludeAlreadySwiped" boolean DEFAULT true NOT NULL,
	"onlyShowActiveUsers" boolean DEFAULT true NOT NULL,
	"preferredHobbies" json,
	"dealbreakers" json,
	"isVisible" boolean DEFAULT true NOT NULL,
	"isPremium" boolean DEFAULT false NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "swipe_preferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "swipe_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"potentialMatchId" uuid NOT NULL,
	"compatibilityScore" integer DEFAULT 0 NOT NULL,
	"commonInterests" json,
	"distance" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"isShown" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swipe_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"totalSwipes" integer DEFAULT 0 NOT NULL,
	"totalLikes" integer DEFAULT 0 NOT NULL,
	"totalSkips" integer DEFAULT 0 NOT NULL,
	"totalMatches" integer DEFAULT 0 NOT NULL,
	"likesReceived" integer DEFAULT 0 NOT NULL,
	"skipsReceived" integer DEFAULT 0 NOT NULL,
	"matchesReceived" integer DEFAULT 0 NOT NULL,
	"averageMatchQuality" integer DEFAULT 0 NOT NULL,
	"lastSwipeAt" timestamp,
	"swipeStreak" integer DEFAULT 0 NOT NULL,
	"bestMatchQuality" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "swipe_stats_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"canWrite" boolean DEFAULT true NOT NULL,
	"muteUntil" timestamp,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"pushNotifications" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastSeenAt" timestamp,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"leftAt" timestamp,
	CONSTRAINT "chat_participants_conversationId_userId_unique" UNIQUE("conversationId","userId")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) DEFAULT 'direct' NOT NULL,
	"title" varchar(255),
	"participant1Id" uuid NOT NULL,
	"participant2Id" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isBlocked" boolean DEFAULT false NOT NULL,
	"blockedBy" uuid,
	"lastMessageId" uuid,
	"lastMessageAt" timestamp,
	"requiresMatch" boolean DEFAULT true NOT NULL,
	"matchId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_participant1Id_participant2Id_unique" UNIQUE("participant1Id","participant2Id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"senderId" uuid NOT NULL,
	"content" text NOT NULL,
	"messageType" varchar(20) DEFAULT 'text' NOT NULL,
	"attachments" json,
	"isEdited" boolean DEFAULT false NOT NULL,
	"editedAt" timestamp,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp,
	"isRead" boolean DEFAULT false NOT NULL,
	"readAt" timestamp,
	"replyToId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "typing_indicators_conversationId_userId_unique" UNIQUE("conversationId","userId")
);
--> statement-breakpoint
CREATE TABLE "universe_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"senderId" uuid,
	"content" text NOT NULL,
	"messageType" varchar(20) DEFAULT 'text' NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedBy" uuid,
	"deletedAt" timestamp,
	"deletionReason" text,
	"isSystemMessage" boolean DEFAULT false NOT NULL,
	"systemData" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universe_chat_moderation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"moderatorId" uuid NOT NULL,
	"targetUserId" uuid,
	"targetMessageId" uuid,
	"actionType" varchar(50) NOT NULL,
	"actionReason" text,
	"actionData" json,
	"duration" integer,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universe_chat_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isMuted" boolean DEFAULT false NOT NULL,
	"mutedUntil" timestamp,
	"mutedBy" uuid,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"leftAt" timestamp,
	CONSTRAINT "universe_chat_participants_universeId_userId_unique" UNIQUE("universeId","userId")
);
--> statement-breakpoint
CREATE TABLE "universe_chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"slowMode" boolean DEFAULT false NOT NULL,
	"slowModeDelay" integer DEFAULT 5 NOT NULL,
	"allowedRoles" json DEFAULT '["member","moderator","creator"]'::json NOT NULL,
	"bannedWords" json DEFAULT '[]'::json NOT NULL,
	"autoModeration" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universe_chat_rooms_universeId_unique" UNIQUE("universeId")
);
--> statement-breakpoint
CREATE TABLE "banned_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern" text NOT NULL,
	"patternType" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"autoAction" varchar(20) DEFAULT 'flag' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"description" text,
	"createdBy" uuid NOT NULL,
	"lastModifiedBy" uuid,
	"hitCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reportId" uuid,
	"moderatorId" uuid NOT NULL,
	"targetUserId" uuid,
	"targetContentId" uuid,
	"targetContentType" varchar(50),
	"actionType" varchar(50) NOT NULL,
	"actionReason" text NOT NULL,
	"actionDuration" integer,
	"isReversible" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"reversedAt" timestamp,
	"reversedBy" uuid,
	"reversalReason" text,
	"metadata" json,
	"internalNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contentType" varchar(50) NOT NULL,
	"contentId" uuid NOT NULL,
	"contentAuthorId" uuid NOT NULL,
	"queueType" varchar(50) NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"flaggedReason" varchar(100),
	"autoFlagScore" integer,
	"assignedTo" uuid,
	"assignedAt" timestamp,
	"reviewedBy" uuid,
	"reviewedAt" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewDecision" varchar(50),
	"reviewNotes" text,
	"actionRequired" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"reportedUserId" uuid,
	"reportedContentType" varchar(50) NOT NULL,
	"reportedContentId" uuid NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"reviewedBy" uuid,
	"reviewedAt" timestamp,
	"resolution" text,
	"actionTaken" text,
	"reporterIpAddress" varchar(45),
	"additionalData" json,
	"internalNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_strikes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"issuedBy" uuid NOT NULL,
	"reportId" uuid,
	"strikeType" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"relatedContentId" uuid,
	"relatedContentType" varchar(50),
	"isActive" boolean DEFAULT true NOT NULL,
	"isExpired" boolean DEFAULT false NOT NULL,
	"expiresAt" timestamp,
	"revokedAt" timestamp,
	"revokedBy" uuid,
	"revokedReason" text,
	"appealedAt" timestamp,
	"appealReason" text,
	"appealStatus" varchar(20) DEFAULT 'none' NOT NULL,
	"appealReviewedBy" uuid,
	"appealReviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_test_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"testId" uuid NOT NULL,
	"userId" uuid,
	"sessionId" varchar(255),
	"variant" varchar(50) NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"hasConverted" boolean DEFAULT false NOT NULL,
	"convertedAt" timestamp,
	"conversionValue" real,
	"userAgent" text,
	"ipAddress" varchar(45),
	"additionalData" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"controlVariant" json NOT NULL,
	"testVariants" json NOT NULL,
	"targetAudience" json,
	"trafficSplit" json NOT NULL,
	"primaryGoal" varchar(100) NOT NULL,
	"secondaryGoals" json,
	"successMetrics" json,
	"totalParticipants" integer DEFAULT 0 NOT NULL,
	"conversionRate" real DEFAULT 0 NOT NULL,
	"statisticalSignificance" real DEFAULT 0 NOT NULL,
	"createdBy" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"sessionId" varchar(255),
	"eventType" varchar(50) NOT NULL,
	"eventCategory" varchar(50) NOT NULL,
	"eventAction" varchar(100) NOT NULL,
	"eventLabel" varchar(200),
	"eventValue" integer,
	"pageUrl" text,
	"referrer" text,
	"userAgent" text,
	"ipAddress" varchar(45),
	"metadata" json,
	"customDimensions" json,
	"loadTime" integer,
	"timeOnPage" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"searchHistoryId" uuid NOT NULL,
	"userId" uuid,
	"sessionId" varchar(255),
	"resultType" varchar(20) NOT NULL,
	"resultId" uuid NOT NULL,
	"resultRank" integer NOT NULL,
	"resultScore" integer,
	"query" text NOT NULL,
	"totalResults" integer NOT NULL,
	"appliedFilters" json,
	"searchTime" timestamp NOT NULL,
	"clickTime" timestamp DEFAULT now() NOT NULL,
	"timeToClick" integer,
	"subsequentActions" json
);
--> statement-breakpoint
CREATE TABLE "search_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer NOT NULL,
	"totalSearches" integer DEFAULT 0 NOT NULL,
	"uniqueUsers" integer DEFAULT 0 NOT NULL,
	"guestSearches" integer DEFAULT 0 NOT NULL,
	"averageQueryLength" integer DEFAULT 0 NOT NULL,
	"topQueries" json,
	"newQueries" json,
	"failedQueries" json,
	"averageResponseTime" integer DEFAULT 0 NOT NULL,
	"averageResultCount" integer DEFAULT 0 NOT NULL,
	"clickThroughRate" integer DEFAULT 0 NOT NULL,
	"searchesPerUser" integer DEFAULT 0 NOT NULL,
	"averageSessionSearches" integer DEFAULT 0 NOT NULL,
	"bounceRate" integer DEFAULT 0 NOT NULL,
	"mostFoundContent" json,
	"popularFilters" json,
	"popularCategories" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_query_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"originalQuery" text NOT NULL,
	"processedQuery" text NOT NULL,
	"queryTokens" json,
	"queryIntent" varchar(50),
	"detectedLanguage" varchar(10),
	"sentiment" varchar(20),
	"processingTimeMs" integer,
	"resultCount" integer,
	"averageRelevanceScore" integer,
	"suggestedCorrections" json,
	"didYouMean" varchar(255),
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"totalUsers" integer DEFAULT 0 NOT NULL,
	"activeUsers" integer DEFAULT 0 NOT NULL,
	"newUsers" integer DEFAULT 0 NOT NULL,
	"deletedUsers" integer DEFAULT 0 NOT NULL,
	"totalPosts" integer DEFAULT 0 NOT NULL,
	"newPosts" integer DEFAULT 0 NOT NULL,
	"deletedPosts" integer DEFAULT 0 NOT NULL,
	"totalComments" integer DEFAULT 0 NOT NULL,
	"newComments" integer DEFAULT 0 NOT NULL,
	"totalUniverses" integer DEFAULT 0 NOT NULL,
	"newUniverses" integer DEFAULT 0 NOT NULL,
	"activeUniverses" integer DEFAULT 0 NOT NULL,
	"totalLikes" integer DEFAULT 0 NOT NULL,
	"totalShares" integer DEFAULT 0 NOT NULL,
	"totalSearches" integer DEFAULT 0 NOT NULL,
	"avgResponseTime" real DEFAULT 0 NOT NULL,
	"errorRate" real DEFAULT 0 NOT NULL,
	"uptime" real DEFAULT 100 NOT NULL,
	"totalReports" integer DEFAULT 0 NOT NULL,
	"resolvedReports" integer DEFAULT 0 NOT NULL,
	"pendingReports" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universe_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"universeId" uuid NOT NULL,
	"date" date NOT NULL,
	"newMembers" integer DEFAULT 0 NOT NULL,
	"activeMembers" integer DEFAULT 0 NOT NULL,
	"postsCreated" integer DEFAULT 0 NOT NULL,
	"commentsCreated" integer DEFAULT 0 NOT NULL,
	"totalEngagement" integer DEFAULT 0 NOT NULL,
	"memberGrowthRate" real DEFAULT 0 NOT NULL,
	"postGrowthRate" real DEFAULT 0 NOT NULL,
	"engagementRate" real DEFAULT 0 NOT NULL,
	"avgPostLength" real DEFAULT 0 NOT NULL,
	"avgCommentsPerPost" real DEFAULT 0 NOT NULL,
	"avgLikesPerPost" real DEFAULT 0 NOT NULL,
	"reportsReceived" integer DEFAULT 0 NOT NULL,
	"contentRemoved" integer DEFAULT 0 NOT NULL,
	"membersWarned" integer DEFAULT 0 NOT NULL,
	"membersBanned" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"date" date NOT NULL,
	"loginCount" integer DEFAULT 0 NOT NULL,
	"sessionDuration" integer DEFAULT 0 NOT NULL,
	"postsCreated" integer DEFAULT 0 NOT NULL,
	"commentsCreated" integer DEFAULT 0 NOT NULL,
	"likesGiven" integer DEFAULT 0 NOT NULL,
	"likesReceived" integer DEFAULT 0 NOT NULL,
	"sharesGiven" integer DEFAULT 0 NOT NULL,
	"sharesReceived" integer DEFAULT 0 NOT NULL,
	"pagesViewed" integer DEFAULT 0 NOT NULL,
	"universesVisited" integer DEFAULT 0 NOT NULL,
	"searchesPerformed" integer DEFAULT 0 NOT NULL,
	"avgTimePerPost" real DEFAULT 0 NOT NULL,
	"avgTimePerSession" real DEFAULT 0 NOT NULL,
	"bounceRate" real DEFAULT 0 NOT NULL,
	"deviceType" varchar(20),
	"browserType" varchar(50),
	"location" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roomId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"content" text,
	"messageType" varchar(20) DEFAULT 'text' NOT NULL,
	"attachments" json,
	"isEdited" boolean DEFAULT false NOT NULL,
	"editedAt" timestamp,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp,
	"isSystemMessage" boolean DEFAULT false NOT NULL,
	"parentMessageId" uuid,
	"migrationStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"migratedToMessageId" uuid,
	"migrationErrors" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"isDeprecated" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_room_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roomId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isMuted" boolean DEFAULT false NOT NULL,
	"mutedUntil" timestamp,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"leftAt" timestamp,
	"lastActiveAt" timestamp,
	"migrationStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"migratedToParticipantId" uuid,
	"isDeprecated" boolean DEFAULT true NOT NULL,
	CONSTRAINT "chat_room_members_roomId_userId_unique" UNIQUE("roomId","userId")
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'public' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"maxMembers" integer DEFAULT 100 NOT NULL,
	"allowGuests" boolean DEFAULT false NOT NULL,
	"createdBy" uuid NOT NULL,
	"ownerId" uuid NOT NULL,
	"password" varchar(255),
	"isPasswordProtected" boolean DEFAULT false NOT NULL,
	"migrationStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"migratedToConversationId" uuid,
	"migrationNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"isDeprecated" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages_in_chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatRoomId" uuid NOT NULL,
	"message" varchar(1000),
	"postedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"migrationStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"migratedToMessageId" uuid,
	"migrationErrors" text,
	"isDeprecated" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migrationType" varchar(50) NOT NULL,
	"legacyEntityType" varchar(50) NOT NULL,
	"legacyEntityId" uuid NOT NULL,
	"newEntityType" varchar(50),
	"newEntityId" uuid,
	"status" varchar(20) NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"lastAttemptAt" timestamp,
	"errorMessage" text,
	"errorDetails" json,
	"canRetry" boolean DEFAULT true NOT NULL,
	"dataMapping" json,
	"migrationNotes" text,
	"isValidated" boolean DEFAULT false NOT NULL,
	"validationErrors" json,
	"validatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reporter_email" text,
	"category" "bug_category" DEFAULT 'other',
	"priority" "bug_priority" DEFAULT 'medium',
	"status" "bug_status" DEFAULT 'open',
	"browser_info" text,
	"user_agent" text,
	"current_url" text,
	"screen_resolution" text,
	"assigned_to" uuid,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universes" ADD CONSTRAINT "universes_creatorId_users_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_searchHistoryId_search_history_id_fk" FOREIGN KEY ("searchHistoryId") REFERENCES "public"."search_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "filters_name_idx" ON "search_filters" USING btree ("filterName");--> statement-breakpoint
CREATE INDEX "filters_type_idx" ON "search_filters" USING btree ("filterType");--> statement-breakpoint
CREATE INDEX "filters_entity_idx" ON "search_filters" USING btree ("entityType");--> statement-breakpoint
CREATE INDEX "search_history_user_idx" ON "search_history" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "search_history_query_idx" ON "search_history" USING btree ("normalizedQuery");--> statement-breakpoint
CREATE INDEX "search_history_created_at_idx" ON "search_history" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "search_entity_idx" ON "search_index" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "search_vector_idx" ON "search_index" USING btree ("searchVector");--> statement-breakpoint
CREATE INDEX "search_universe_idx" ON "search_index" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "search_author_idx" ON "search_index" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "search_popularity_idx" ON "search_index" USING btree ("popularityScore");--> statement-breakpoint
CREATE INDEX "search_created_at_idx" ON "search_index" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "suggestions_text_idx" ON "search_suggestions" USING btree ("suggestionText");--> statement-breakpoint
CREATE INDEX "suggestions_type_idx" ON "search_suggestions" USING btree ("suggestionType");--> statement-breakpoint
CREATE INDEX "suggestions_popularity_idx" ON "search_suggestions" USING btree ("searchCount");--> statement-breakpoint
CREATE INDEX "trending_topics_topic_idx" ON "trending_topics" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "trending_topics_type_idx" ON "trending_topics" USING btree ("topicType");--> statement-breakpoint
CREATE INDEX "trending_topics_engagement_idx" ON "trending_topics" USING btree ("engagementScore");--> statement-breakpoint
CREATE INDEX "trending_topics_category_idx" ON "trending_topics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "activities_user_idx" ON "user_activities" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "user_activities" USING btree ("activityType");--> statement-breakpoint
CREATE INDEX "activities_entity_idx" ON "user_activities" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "activities_created_at_idx" ON "user_activities" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_idx" ON "user_auth_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "auth_tokens_token_idx" ON "user_auth_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_tokens_expires_at_idx" ON "user_auth_tokens" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "user_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_last_activity_idx" ON "user_sessions" USING btree ("lastActivityAt");--> statement-breakpoint
CREATE INDEX "user_verifications_user_id_idx" ON "user_verifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_verifications_type_idx" ON "user_verifications" USING btree ("verificationType");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_last_activity_idx" ON "users" USING btree ("lastActivityAt");--> statement-breakpoint
CREATE INDEX "friendships_requester_idx" ON "friendships" USING btree ("requesterId");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "friendships" USING btree ("addresseeId");--> statement-breakpoint
CREATE INDEX "friendships_status_idx" ON "friendships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_idx" ON "user_blocks" USING btree ("blockerId");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_idx" ON "user_blocks" USING btree ("blockedId");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("roleId");--> statement-breakpoint
CREATE INDEX "user_roles_assigned_at_idx" ON "user_roles" USING btree ("assignedAt");--> statement-breakpoint
CREATE INDEX "media_uploader_idx" ON "media" USING btree ("uploaderId");--> statement-breakpoint
CREATE INDEX "media_filename_idx" ON "media" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "media_mime_type_idx" ON "media" USING btree ("mimeType");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "post_reactions_post_idx" ON "post_reactions" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "post_reactions_user_idx" ON "post_reactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "post_shares_post_idx" ON "post_shares" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "post_shares_user_idx" ON "post_shares" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "post_shares_type_idx" ON "post_shares" USING btree ("shareType");--> statement-breakpoint
CREATE INDEX "post_shares_created_at_idx" ON "post_shares" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "posts_universe_idx" ON "posts" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "posts_content_type_idx" ON "posts" USING btree ("contentType");--> statement-breakpoint
CREATE INDEX "comment_reactions_comment_idx" ON "comment_reactions" USING btree ("commentId");--> statement-breakpoint
CREATE INDEX "comment_reactions_user_idx" ON "comment_reactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "join_requests_universe_idx" ON "universe_join_requests" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "join_requests_user_idx" ON "universe_join_requests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "join_requests_status_idx" ON "universe_join_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "universe_members_universe_idx" ON "universe_members" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_members_user_idx" ON "universe_members" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "universe_members_role_idx" ON "universe_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "universe_members_status_idx" ON "universe_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "universe_members_active_idx" ON "universe_members" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "universes_slug_idx" ON "universes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "universes_creator_idx" ON "universes" USING btree ("creatorId");--> statement-breakpoint
CREATE INDEX "universes_category_idx" ON "universes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "universes_member_count_idx" ON "universes" USING btree ("memberCount");--> statement-breakpoint
CREATE INDEX "matches_user1_idx" ON "matches" USING btree ("user1Id");--> statement-breakpoint
CREATE INDEX "matches_user2_idx" ON "matches" USING btree ("user2Id");--> statement-breakpoint
CREATE INDEX "matches_matched_at_idx" ON "matches" USING btree ("matchedAt");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "swipe_actions_swiper_idx" ON "swipe_actions" USING btree ("swiperId");--> statement-breakpoint
CREATE INDEX "swipe_actions_target_idx" ON "swipe_actions" USING btree ("targetId");--> statement-breakpoint
CREATE INDEX "swipe_actions_action_idx" ON "swipe_actions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "swipe_actions_timestamp_idx" ON "swipe_actions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "swipe_preferences_user_id_idx" ON "swipe_preferences" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "swipe_queue_user_id_idx" ON "swipe_queue" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "swipe_queue_potential_match_idx" ON "swipe_queue" USING btree ("potentialMatchId");--> statement-breakpoint
CREATE INDEX "swipe_queue_priority_idx" ON "swipe_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "swipe_queue_expires_at_idx" ON "swipe_queue" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "swipe_stats_user_id_idx" ON "swipe_stats" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_participants_conversation_idx" ON "chat_participants" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "chat_participants_user_idx" ON "chat_participants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "conversations_participant1_idx" ON "conversations" USING btree ("participant1Id");--> statement-breakpoint
CREATE INDEX "conversations_participant2_idx" ON "conversations" USING btree ("participant2Id");--> statement-breakpoint
CREATE INDEX "conversations_last_message_at_idx" ON "conversations" USING btree ("lastMessageAt");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_at_idx" ON "messages" USING btree ("conversationId","createdAt");--> statement-breakpoint
CREATE INDEX "typing_indicators_conversation_idx" ON "typing_indicators" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "typing_indicators_expires_at_idx" ON "typing_indicators" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "universe_chat_messages_universe_idx" ON "universe_chat_messages" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_chat_messages_sender_idx" ON "universe_chat_messages" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "universe_chat_messages_created_at_idx" ON "universe_chat_messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_universe_idx" ON "universe_chat_moderation" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_moderator_idx" ON "universe_chat_moderation" USING btree ("moderatorId");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_target_user_idx" ON "universe_chat_moderation" USING btree ("targetUserId");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_action_type_idx" ON "universe_chat_moderation" USING btree ("actionType");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_universe_idx" ON "universe_chat_participants" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_user_idx" ON "universe_chat_participants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_active_idx" ON "universe_chat_participants" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "universe_chat_rooms_universe_idx" ON "universe_chat_rooms" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "banned_patterns_pattern_type_idx" ON "banned_patterns" USING btree ("patternType");--> statement-breakpoint
CREATE INDEX "banned_patterns_category_idx" ON "banned_patterns" USING btree ("category");--> statement-breakpoint
CREATE INDEX "banned_patterns_is_active_idx" ON "banned_patterns" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "moderation_actions_report_idx" ON "moderation_actions" USING btree ("reportId");--> statement-breakpoint
CREATE INDEX "moderation_actions_moderator_idx" ON "moderation_actions" USING btree ("moderatorId");--> statement-breakpoint
CREATE INDEX "moderation_actions_target_user_idx" ON "moderation_actions" USING btree ("targetUserId");--> statement-breakpoint
CREATE INDEX "moderation_actions_action_type_idx" ON "moderation_actions" USING btree ("actionType");--> statement-breakpoint
CREATE INDEX "moderation_actions_created_at_idx" ON "moderation_actions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "moderation_queue_content_idx" ON "moderation_queue" USING btree ("contentType","contentId");--> statement-breakpoint
CREATE INDEX "moderation_queue_author_idx" ON "moderation_queue" USING btree ("contentAuthorId");--> statement-breakpoint
CREATE INDEX "moderation_queue_queue_type_idx" ON "moderation_queue" USING btree ("queueType");--> statement-breakpoint
CREATE INDEX "moderation_queue_priority_idx" ON "moderation_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "moderation_queue_status_idx" ON "moderation_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "moderation_queue_assigned_to_idx" ON "moderation_queue" USING btree ("assignedTo");--> statement-breakpoint
CREATE INDEX "moderation_reports_reporter_idx" ON "moderation_reports" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "moderation_reports_reported_user_idx" ON "moderation_reports" USING btree ("reportedUserId");--> statement-breakpoint
CREATE INDEX "moderation_reports_content_idx" ON "moderation_reports" USING btree ("reportedContentType","reportedContentId");--> statement-breakpoint
CREATE INDEX "moderation_reports_status_idx" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "moderation_reports_priority_idx" ON "moderation_reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "moderation_reports_created_at_idx" ON "moderation_reports" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "user_strikes_user_idx" ON "user_strikes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_strikes_issued_by_idx" ON "user_strikes" USING btree ("issuedBy");--> statement-breakpoint
CREATE INDEX "user_strikes_report_idx" ON "user_strikes" USING btree ("reportId");--> statement-breakpoint
CREATE INDEX "user_strikes_strike_type_idx" ON "user_strikes" USING btree ("strikeType");--> statement-breakpoint
CREATE INDEX "user_strikes_is_active_idx" ON "user_strikes" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "user_strikes_expires_at_idx" ON "user_strikes" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "ab_test_participants_test_user_idx" ON "ab_test_participants" USING btree ("testId","userId");--> statement-breakpoint
CREATE INDEX "ab_test_participants_test_idx" ON "ab_test_participants" USING btree ("testId");--> statement-breakpoint
CREATE INDEX "ab_test_participants_variant_idx" ON "ab_test_participants" USING btree ("variant");--> statement-breakpoint
CREATE INDEX "ab_test_participants_converted_idx" ON "ab_test_participants" USING btree ("hasConverted");--> statement-breakpoint
CREATE INDEX "ab_tests_name_idx" ON "ab_tests" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ab_tests_status_idx" ON "ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ab_tests_created_by_idx" ON "ab_tests" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "event_tracking_user_idx" ON "event_tracking" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "event_tracking_session_idx" ON "event_tracking" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "event_tracking_event_type_idx" ON "event_tracking" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "event_tracking_event_category_idx" ON "event_tracking" USING btree ("eventCategory");--> statement-breakpoint
CREATE INDEX "event_tracking_created_at_idx" ON "event_tracking" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "clicks_user_idx" ON "search_clicks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "clicks_result_idx" ON "search_clicks" USING btree ("resultType","resultId");--> statement-breakpoint
CREATE INDEX "clicks_time_idx" ON "search_clicks" USING btree ("clickTime");--> statement-breakpoint
CREATE INDEX "metrics_date_hour_idx" ON "search_metrics" USING btree ("date","hour");--> statement-breakpoint
CREATE INDEX "metrics_date_idx" ON "search_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "query_analytics_query_idx" ON "search_query_analytics" USING btree ("originalQuery");--> statement-breakpoint
CREATE INDEX "query_analytics_intent_idx" ON "search_query_analytics" USING btree ("queryIntent");--> statement-breakpoint
CREATE INDEX "query_analytics_date_idx" ON "search_query_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "system_analytics_date_idx" ON "system_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "universe_analytics_universe_date_idx" ON "universe_analytics" USING btree ("universeId","date");--> statement-breakpoint
CREATE INDEX "universe_analytics_date_idx" ON "universe_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "universe_analytics_universe_idx" ON "universe_analytics" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "user_analytics_user_date_idx" ON "user_analytics" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "user_analytics_date_idx" ON "user_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "user_analytics_user_idx" ON "user_analytics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_messages_room_idx" ON "chat_messages" USING btree ("roomId");--> statement-breakpoint
CREATE INDEX "chat_messages_user_idx" ON "chat_messages" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_messages_type_idx" ON "chat_messages" USING btree ("messageType");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "chat_messages_migration_status_idx" ON "chat_messages" USING btree ("migrationStatus");--> statement-breakpoint
CREATE INDEX "chat_room_members_room_idx" ON "chat_room_members" USING btree ("roomId");--> statement-breakpoint
CREATE INDEX "chat_room_members_user_idx" ON "chat_room_members" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_room_members_role_idx" ON "chat_room_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "chat_room_members_migration_status_idx" ON "chat_room_members" USING btree ("migrationStatus");--> statement-breakpoint
CREATE INDEX "chat_rooms_name_idx" ON "chat_rooms" USING btree ("name");--> statement-breakpoint
CREATE INDEX "chat_rooms_type_idx" ON "chat_rooms" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_rooms_owner_idx" ON "chat_rooms" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "chat_rooms_migration_status_idx" ON "chat_rooms" USING btree ("migrationStatus");--> statement-breakpoint
CREATE INDEX "messages_chat_room_idx" ON "messages_in_chat_rooms" USING btree ("chatRoomId");--> statement-breakpoint
CREATE INDEX "messages_user_idx" ON "messages_in_chat_rooms" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "messages_posted_at_idx" ON "messages_in_chat_rooms" USING btree ("postedAt");--> statement-breakpoint
CREATE INDEX "messages_migration_status_idx" ON "messages_in_chat_rooms" USING btree ("migrationStatus");--> statement-breakpoint
CREATE INDEX "migration_log_type_idx" ON "migration_log" USING btree ("migrationType");--> statement-breakpoint
CREATE INDEX "migration_log_legacy_entity_idx" ON "migration_log" USING btree ("legacyEntityType","legacyEntityId");--> statement-breakpoint
CREATE INDEX "migration_log_status_idx" ON "migration_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "migration_log_attempt_count_idx" ON "migration_log" USING btree ("attemptCount");