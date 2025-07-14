CREATE TABLE "universe_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatRoomId" uuid NOT NULL,
	"universeId" uuid NOT NULL,
	"senderId" uuid NOT NULL,
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
	"chatRoomId" uuid NOT NULL,
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
	"chatRoomId" uuid NOT NULL,
	"universeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isMuted" boolean DEFAULT false NOT NULL,
	"mutedUntil" timestamp,
	"mutedBy" uuid,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"leftAt" timestamp,
	CONSTRAINT "universe_chat_participants_chatRoomId_userId_unique" UNIQUE("chatRoomId","userId")
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
CREATE INDEX "universe_chat_messages_room_idx" ON "universe_chat_messages" USING btree ("chatRoomId");--> statement-breakpoint
CREATE INDEX "universe_chat_messages_universe_idx" ON "universe_chat_messages" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_chat_messages_sender_idx" ON "universe_chat_messages" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "universe_chat_messages_created_at_idx" ON "universe_chat_messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_room_idx" ON "universe_chat_moderation" USING btree ("chatRoomId");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_moderator_idx" ON "universe_chat_moderation" USING btree ("moderatorId");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_target_user_idx" ON "universe_chat_moderation" USING btree ("targetUserId");--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_action_type_idx" ON "universe_chat_moderation" USING btree ("actionType");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_room_idx" ON "universe_chat_participants" USING btree ("chatRoomId");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_user_idx" ON "universe_chat_participants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_active_idx" ON "universe_chat_participants" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "universe_chat_rooms_universe_idx" ON "universe_chat_rooms" USING btree ("universeId");