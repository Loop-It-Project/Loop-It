CREATE TABLE "typing_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "typing_indicators_conversationId_userId_unique" UNIQUE("conversationId","userId")
);
--> statement-breakpoint
ALTER TABLE "conversation_participants" RENAME TO "chat_participants";--> statement-breakpoint
ALTER TABLE "chat_participants" RENAME COLUMN "lastReadAt" TO "lastSeenAt";--> statement-breakpoint
ALTER TABLE "chat_participants" DROP CONSTRAINT "conversation_participants_conversationId_userId_unique";--> statement-breakpoint
DROP INDEX "conv_participants_conv_id_idx";--> statement-breakpoint
DROP INDEX "conv_participants_user_id_idx";--> statement-breakpoint
DROP INDEX "conversations_type_idx";--> statement-breakpoint
DROP INDEX "conversations_universe_id_idx";--> statement-breakpoint
DROP INDEX "messages_conversation_id_idx";--> statement-breakpoint
DROP INDEX "messages_user_id_idx";--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "type" SET DEFAULT 'direct';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "canWrite" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "muteUntil" timestamp;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "emailNotifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "pushNotifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "leftAt" timestamp;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant1Id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant2Id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "isBlocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "blockedBy" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "lastMessageId" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "lastMessageAt" timestamp;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "requiresMatch" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "matchId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "senderId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachments" json;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "isEdited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "isRead" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "readAt" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "typing_indicators_conversation_idx" ON "typing_indicators" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "typing_indicators_expires_at_idx" ON "typing_indicators" USING btree ("expiresAt");--> statement-breakpoint
ALTER TABLE "universes" ADD CONSTRAINT "universes_creatorId_users_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_participants_conversation_idx" ON "chat_participants" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "chat_participants_user_idx" ON "chat_participants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "conversations_participant1_idx" ON "conversations" USING btree ("participant1Id");--> statement-breakpoint
CREATE INDEX "conversations_participant2_idx" ON "conversations" USING btree ("participant2Id");--> statement-breakpoint
CREATE INDEX "conversations_last_message_at_idx" ON "conversations" USING btree ("lastMessageAt");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_at_idx" ON "messages" USING btree ("conversationId","createdAt");--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "universeId";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "createdBy";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "mediaId";--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_conversationId_userId_unique" UNIQUE("conversationId","userId");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1Id_participant2Id_unique" UNIQUE("participant1Id","participant2Id");