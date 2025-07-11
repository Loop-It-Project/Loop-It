CREATE TABLE "post_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"userId" uuid,
	"shareType" varchar(50) NOT NULL,
	"sharedTo" varchar(100),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "post_shares_post_idx" ON "post_shares" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "post_shares_user_idx" ON "post_shares" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "post_shares_type_idx" ON "post_shares" USING btree ("shareType");--> statement-breakpoint
CREATE INDEX "post_shares_created_at_idx" ON "post_shares" USING btree ("createdAt");