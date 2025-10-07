import { integer, json, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { DEFAULT_WIDGET_CONFIG } from "@/lib/widget/defaults";


export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  data: json("data"),
  website: text("website").notNull(),
  shopifyDomain: text("shopify_domain"),
  shopifyAccessToken: text("shopify_access_token"),
  shopifyApiKey: text("shopify_api_key"),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const widgetSettings = pgTable("widget_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Colors from shadcn theme (using constants from defaults.ts)
  primaryColor: varchar("primary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.primaryColor),
  backgroundColor: varchar("background_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.backgroundColor),
  secondaryColor: varchar("secondary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.secondaryColor),
  textPrimaryColor: varchar("text_primary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.textPrimaryColor),
  textSecondaryColor: varchar("text_secondary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.textSecondaryColor),
  borderColor: varchar("border_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.borderColor),
  
  logoUrl: text("logo_url"),
  logoWidth: integer("logo_width").default(DEFAULT_WIDGET_CONFIG.logoWidth),
  logoHeight: integer("logo_height").default(DEFAULT_WIDGET_CONFIG.logoHeight),
  logoBorderRadius: integer("logo_border_radius").default(DEFAULT_WIDGET_CONFIG.logoBorderRadius),
  
  headerTitle: varchar("header_title", { length: 100 }).default(DEFAULT_WIDGET_CONFIG.headerTitle),
  headerSubtitle: varchar("header_subtitle", { length: 100 }).default(DEFAULT_WIDGET_CONFIG.headerSubtitle),
  inputPlaceholder: varchar("input_placeholder", { length: 200 }).default(DEFAULT_WIDGET_CONFIG.inputPlaceholder),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatsRelations = relations(chats, ({ one }) => ({
  organization: one(organizations, {
    fields: [chats.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  chats: many(chats),
  widgetSettings: one(widgetSettings, {
    fields: [organizations.id],
    references: [widgetSettings.organizationId],
  }),
}));

export const widgetSettingsRelations = relations(widgetSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [widgetSettings.organizationId],
    references: [organizations.id],
  }),
}));




