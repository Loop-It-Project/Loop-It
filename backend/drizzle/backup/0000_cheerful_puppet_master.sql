CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" integer NOT NULL,
	"creatorId" uuid NOT NULL,
	"pictureId" integer,
	"description" varchar(1000),
	"universeId" uuid NOT NULL
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
CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastReadAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "conversation_participants_conversationId_userId_unique" UNIQUE("conversationId","userId")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255),
	"universeId" uuid,
	"createdBy" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
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
	CONSTRAINT "friendships_requesterId_addresseeId_unique" UNIQUE("requesterId","addresseeId")
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
CREATE TABLE "messages_in_chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatRoomId" uuid NOT NULL,
	"message" varchar(1000),
	"postedAt" integer NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"content" text,
	"mediaId" uuid,
	"messageType" varchar(20) DEFAULT 'text' NOT NULL,
	"replyToId" uuid,
	"editedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"reportedContentType" varchar(50) NOT NULL,
	"reportedContentId" uuid NOT NULL,
	"reportedUserId" uuid,
	"reason" varchar(100) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewedBy" uuid,
	"reviewedAt" timestamp,
	"resolution" text,
	"actionTaken" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
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
	"searchSource" varchar(50),
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
	"permissions" json,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastActivityAt" timestamp,
	"invitedBy" uuid,
	"notificationsEnabled" boolean DEFAULT true NOT NULL,
	"nickname" varchar(50),
	"customRole" varchar(50),
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
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "universes_hashtag_unique" UNIQUE("hashtag")
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
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_creatorId_users_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_universeId_universes_id_fk" FOREIGN KEY ("universeId") REFERENCES "public"."universes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_searchHistoryId_search_history_id_fk" FOREIGN KEY ("searchHistoryId") REFERENCES "public"."search_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "conv_participants_conv_id_idx" ON "conversation_participants" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "conv_participants_user_id_idx" ON "conversation_participants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "conversations_type_idx" ON "conversations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "conversations_universe_id_idx" ON "conversations" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "friendships_requester_idx" ON "friendships" USING btree ("requesterId");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "friendships" USING btree ("addresseeId");--> statement-breakpoint
CREATE INDEX "friendships_status_idx" ON "friendships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_uploader_idx" ON "media" USING btree ("uploaderId");--> statement-breakpoint
CREATE INDEX "media_filename_idx" ON "media" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "media_mime_type_idx" ON "media" USING btree ("mimeType");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "messages_user_id_idx" ON "messages" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "reports_reporter_idx" ON "moderation_reports" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "reports_content_idx" ON "moderation_reports" USING btree ("reportedContentType","reportedContentId");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "moderation_reports" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "post_reactions_post_idx" ON "post_reactions" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "post_reactions_user_idx" ON "post_reactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "posts_universe_idx" ON "posts" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "posts_content_type_idx" ON "posts" USING btree ("contentType");--> statement-breakpoint
CREATE INDEX "posts_tags_idx" ON "posts" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "posts_hashtags_idx" ON "posts" USING btree ("hashtags");--> statement-breakpoint
CREATE INDEX "profiles_interests_idx" ON "profiles" USING btree ("interests");--> statement-breakpoint
CREATE INDEX "clicks_user_idx" ON "search_clicks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "clicks_result_idx" ON "search_clicks" USING btree ("resultType","resultId");--> statement-breakpoint
CREATE INDEX "clicks_time_idx" ON "search_clicks" USING btree ("clickTime");--> statement-breakpoint
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
CREATE INDEX "search_location_idx" ON "search_index" USING btree ("location");--> statement-breakpoint
CREATE INDEX "search_popularity_idx" ON "search_index" USING btree ("popularityScore");--> statement-breakpoint
CREATE INDEX "search_created_at_idx" ON "search_index" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "metrics_date_hour_idx" ON "search_metrics" USING btree ("date","hour");--> statement-breakpoint
CREATE INDEX "metrics_date_idx" ON "search_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "query_analytics_query_idx" ON "search_query_analytics" USING btree ("originalQuery");--> statement-breakpoint
CREATE INDEX "query_analytics_intent_idx" ON "search_query_analytics" USING btree ("queryIntent");--> statement-breakpoint
CREATE INDEX "query_analytics_date_idx" ON "search_query_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "suggestions_text_idx" ON "search_suggestions" USING btree ("suggestionText");--> statement-breakpoint
CREATE INDEX "suggestions_type_idx" ON "search_suggestions" USING btree ("suggestionType");--> statement-breakpoint
CREATE INDEX "suggestions_popularity_idx" ON "search_suggestions" USING btree ("searchCount");--> statement-breakpoint
CREATE INDEX "trending_topics_topic_idx" ON "trending_topics" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "trending_topics_type_idx" ON "trending_topics" USING btree ("topicType");--> statement-breakpoint
CREATE INDEX "trending_topics_engagement_idx" ON "trending_topics" USING btree ("engagementScore");--> statement-breakpoint
CREATE INDEX "trending_topics_category_idx" ON "trending_topics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "join_requests_universe_idx" ON "universe_join_requests" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "join_requests_user_idx" ON "universe_join_requests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "join_requests_status_idx" ON "universe_join_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "universe_members_universe_idx" ON "universe_members" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_members_user_idx" ON "universe_members" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "universe_members_role_idx" ON "universe_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "universes_slug_idx" ON "universes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "universes_creator_idx" ON "universes" USING btree ("creatorId");--> statement-breakpoint
CREATE INDEX "universes_category_idx" ON "universes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "universes_tags_idx" ON "universes" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "universes_member_count_idx" ON "universes" USING btree ("memberCount");--> statement-breakpoint
CREATE INDEX "activities_user_idx" ON "user_activities" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "user_activities" USING btree ("activityType");--> statement-breakpoint
CREATE INDEX "activities_entity_idx" ON "user_activities" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "activities_created_at_idx" ON "user_activities" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_idx" ON "user_auth_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "auth_tokens_token_idx" ON "user_auth_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_tokens_expires_at_idx" ON "user_auth_tokens" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_idx" ON "user_blocks" USING btree ("blockerId");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_idx" ON "user_blocks" USING btree ("blockedId");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "user_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_last_activity_idx" ON "user_sessions" USING btree ("lastActivityAt");--> statement-breakpoint
CREATE INDEX "user_verifications_user_id_idx" ON "user_verifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_verifications_type_idx" ON "user_verifications" USING btree ("verificationType");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_location_idx" ON "users" USING btree ("location");--> statement-breakpoint
CREATE INDEX "users_last_activity_idx" ON "users" USING btree ("lastActivityAt");