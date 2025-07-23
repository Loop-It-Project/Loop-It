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
CREATE INDEX "swipe_stats_user_id_idx" ON "swipe_stats" USING btree ("userId");