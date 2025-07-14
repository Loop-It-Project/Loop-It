ALTER TABLE "universe_members" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "isBanned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "isMuted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "approvalNotes" text;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "approvalBy" uuid;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "approvalAt" timestamp;--> statement-breakpoint
ALTER TABLE "universe_members" ADD COLUMN "requestMessage" text;--> statement-breakpoint
CREATE INDEX "universe_members_status_idx" ON "universe_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "universe_members_active_idx" ON "universe_members" USING btree ("isActive");