CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"data" json,
	"website" text NOT NULL,
	"shopify_domain" text,
	"shopify_access_token" text,
	"shopify_api_key" text
);
--> statement-breakpoint
CREATE TABLE "widget_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"primary_color" varchar(7) DEFAULT '#171717',
	"background_color" varchar(7) DEFAULT '#ffffff',
	"secondary_color" varchar(7) DEFAULT '#f5f5f5',
	"text_primary_color" varchar(7) DEFAULT '#0a0a0a',
	"text_secondary_color" varchar(7) DEFAULT '#fafafa',
	"border_color" varchar(7) DEFAULT '#e5e5e5',
	"logo_url" text,
	"logo_width" integer DEFAULT 40,
	"logo_height" integer DEFAULT 40,
	"logo_border_radius" integer DEFAULT 0,
	"header_title" varchar(100) DEFAULT 'Chat Support',
	"header_subtitle" varchar(100) DEFAULT 'We reply instantly',
	"input_placeholder" varchar(200) DEFAULT 'What would you like to know?',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widget_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_settings" ADD CONSTRAINT "widget_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;