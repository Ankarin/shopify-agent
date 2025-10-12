ALTER TABLE "chats" ADD COLUMN "after_hours" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timezone" text DEFAULT 'Europe/London';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "business_hours_start" integer DEFAULT 9;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "business_hours_end" integer DEFAULT 17;