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
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_creatorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_universeId_universes_id_fk";
--> statement-breakpoint
ALTER TABLE "moderation_reports" DROP CONSTRAINT "moderation_reports_reportedUserId_users_id_fk";
--> statement-breakpoint
DROP INDEX "reports_reporter_idx";--> statement-breakpoint
DROP INDEX "reports_content_idx";--> statement-breakpoint
DROP INDEX "reports_status_idx";--> statement-breakpoint
DROP INDEX "reports_created_at_idx";--> statement-breakpoint
ALTER TABLE "chat_rooms" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "moderation_reports" ALTER COLUMN "actionTaken" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "type" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "maxMembers" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "allowGuests" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "createdBy" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "ownerId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "password" varchar(255);--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "isPasswordProtected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "migrationStatus" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "migratedToConversationId" uuid;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "migrationNotes" text;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "isDeprecated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "messages_in_chat_rooms" ADD COLUMN "migrationStatus" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages_in_chat_rooms" ADD COLUMN "migratedToMessageId" uuid;--> statement-breakpoint
ALTER TABLE "messages_in_chat_rooms" ADD COLUMN "migrationErrors" text;--> statement-breakpoint
ALTER TABLE "messages_in_chat_rooms" ADD COLUMN "isDeprecated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD COLUMN "category" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD COLUMN "severity" varchar(20) DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD COLUMN "priority" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD COLUMN "reporterIpAddress" varchar(45);--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD COLUMN "additionalData" json;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD COLUMN "internalNotes" text;--> statement-breakpoint
ALTER TABLE "universes" ADD COLUMN "isClosed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
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
CREATE INDEX "migration_log_type_idx" ON "migration_log" USING btree ("migrationType");--> statement-breakpoint
CREATE INDEX "migration_log_legacy_entity_idx" ON "migration_log" USING btree ("legacyEntityType","legacyEntityId");--> statement-breakpoint
CREATE INDEX "migration_log_status_idx" ON "migration_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "migration_log_attempt_count_idx" ON "migration_log" USING btree ("attemptCount");--> statement-breakpoint
CREATE INDEX "chat_rooms_name_idx" ON "chat_rooms" USING btree ("name");--> statement-breakpoint
CREATE INDEX "chat_rooms_type_idx" ON "chat_rooms" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_rooms_owner_idx" ON "chat_rooms" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "chat_rooms_migration_status_idx" ON "chat_rooms" USING btree ("migrationStatus");--> statement-breakpoint
CREATE INDEX "messages_chat_room_idx" ON "messages_in_chat_rooms" USING btree ("chatRoomId");--> statement-breakpoint
CREATE INDEX "messages_user_idx" ON "messages_in_chat_rooms" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "messages_posted_at_idx" ON "messages_in_chat_rooms" USING btree ("postedAt");--> statement-breakpoint
CREATE INDEX "messages_migration_status_idx" ON "messages_in_chat_rooms" USING btree ("migrationStatus");--> statement-breakpoint
CREATE INDEX "moderation_reports_reporter_idx" ON "moderation_reports" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "moderation_reports_content_idx" ON "moderation_reports" USING btree ("reportedContentType","reportedContentId");--> statement-breakpoint
CREATE INDEX "moderation_reports_status_idx" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "moderation_reports_priority_idx" ON "moderation_reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "moderation_reports_created_at_idx" ON "moderation_reports" USING btree ("createdAt");--> statement-breakpoint
ALTER TABLE "chat_rooms" DROP COLUMN "creatorId";--> statement-breakpoint
ALTER TABLE "chat_rooms" DROP COLUMN "pictureId";--> statement-breakpoint
ALTER TABLE "chat_rooms" DROP COLUMN "universeId";