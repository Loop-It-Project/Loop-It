ALTER TABLE "chat_rooms" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "chat_rooms" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "chat_rooms" ALTER COLUMN "pictureId" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "messages_in_chat_rooms" ALTER COLUMN "postedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "messages_in_chat_rooms" ALTER COLUMN "postedAt" SET DEFAULT now();