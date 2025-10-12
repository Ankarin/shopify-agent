CREATE TABLE "chat_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"shopify_order_id" text NOT NULL,
	"order_number" text NOT NULL,
	"order_amount" text NOT NULL,
	"currency" varchar(3) NOT NULL,
	"order_date" timestamp NOT NULL,
	"attribution_window" varchar(10) DEFAULT '24h',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "customer_email" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "customer_phone" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "message_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "escalated" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "resolved" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_conversions" ADD CONSTRAINT "chat_conversions_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversions" ADD CONSTRAINT "chat_conversions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;