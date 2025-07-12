ALTER TABLE "universe_chat_participants" DROP CONSTRAINT "universe_chat_participants_chatRoomId_userId_unique";--> statement-breakpoint
DROP INDEX "universe_chat_messages_room_idx";--> statement-breakpoint
DROP INDEX "universe_chat_moderation_room_idx";--> statement-breakpoint
DROP INDEX "universe_chat_participants_room_idx";--> statement-breakpoint
ALTER TABLE "universe_chat_messages" ALTER COLUMN "senderId" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "universe_chat_moderation_universe_idx" ON "universe_chat_moderation" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "universe_chat_participants_universe_idx" ON "universe_chat_participants" USING btree ("universeId");--> statement-breakpoint
ALTER TABLE "universe_chat_messages" DROP COLUMN "chatRoomId";--> statement-breakpoint
ALTER TABLE "universe_chat_moderation" DROP COLUMN "chatRoomId";--> statement-breakpoint
ALTER TABLE "universe_chat_participants" DROP COLUMN "chatRoomId";--> statement-breakpoint
ALTER TABLE "universe_chat_participants" ADD CONSTRAINT "universe_chat_participants_universeId_userId_unique" UNIQUE("universeId","userId");