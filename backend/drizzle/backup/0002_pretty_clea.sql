ALTER TABLE "universe_members" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "universes" ADD COLUMN "isDeleted" boolean DEFAULT false NOT NULL;