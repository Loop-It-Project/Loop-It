ALTER TABLE "users" ADD COLUMN "geoTrackingEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "geoTrackingAccuracy" varchar(20) DEFAULT 'city' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "autoUpdateLocation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "showDistanceToOthers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "maxSearchRadius" integer DEFAULT 100 NOT NULL;