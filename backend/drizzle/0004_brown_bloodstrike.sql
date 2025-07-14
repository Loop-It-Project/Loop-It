CREATE TYPE "public"."bug_category" AS ENUM('ui', 'functionality', 'performance', 'security', 'data', 'other');--> statement-breakpoint
CREATE TYPE "public"."bug_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."bug_status" AS ENUM('open', 'in_progress', 'resolved', 'closed', 'duplicate', 'invalid');--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reporter_email" text,
	"category" "bug_category" DEFAULT 'other',
	"priority" "bug_priority" DEFAULT 'medium',
	"status" "bug_status" DEFAULT 'open',
	"browser_info" text,
	"user_agent" text,
	"current_url" text,
	"screen_resolution" text,
	"assigned_to" uuid,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;