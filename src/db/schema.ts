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
  timezone: text("timezone").default("Europe/London"),
  businessHoursStart: integer("business_hours_start").default(9),
  businessHoursEnd: integer("business_hours_end").default(17),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  messageCount: integer("message_count").default(0).notNull(),
  unresolved: integer("unresolved").default(0).notNull(),
  resolved: integer("resolved").default(0).notNull(),
  afterHours: integer("after_hours").default(0).notNull(),
  questionTopic: text("question_topic"),
  questionText: text("question_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const widgetSettings = pgTable("widget_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),

  primaryColor: varchar("primary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.primaryColor),
  backgroundColor: varchar("background_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.backgroundColor),
  secondaryColor: varchar("secondary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.secondaryColor),
  textPrimaryColor: varchar("text_primary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.textPrimaryColor),
  textSecondaryColor: varchar("text_secondary_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.textSecondaryColor),
  borderColor: varchar("border_color", { length: 7 }).default(DEFAULT_WIDGET_CONFIG.borderColor),

  logoKey: text("logo_key"),
  logoWidth: integer("logo_width").default(DEFAULT_WIDGET_CONFIG.logoWidth),
  logoHeight: integer("logo_height").default(DEFAULT_WIDGET_CONFIG.logoHeight),
  logoBorderRadius: integer("logo_border_radius").default(DEFAULT_WIDGET_CONFIG.logoBorderRadius),

  headerTitle: varchar("header_title", { length: 100 }).default(DEFAULT_WIDGET_CONFIG.headerTitle),
  headerSubtitle: varchar("header_subtitle", { length: 100 }).default(DEFAULT_WIDGET_CONFIG.headerSubtitle),
  inputPlaceholder: varchar("input_placeholder", { length: 200 }).default(DEFAULT_WIDGET_CONFIG.inputPlaceholder),
  initialMessage: text("initial_message").default(DEFAULT_WIDGET_CONFIG.initialMessage),
  showBranding: integer("show_branding").default(1),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatConversions = pgTable("chat_conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shopifyOrderId: text("shopify_order_id").notNull(),
  orderNumber: text("order_number").notNull(),
  orderAmount: text("order_amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  orderDate: timestamp("order_date").notNull(),
  attributionWindow: varchar("attribution_window", { length: 10 }).default("24h"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatsRelations = relations(chats, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [chats.organizationId],
    references: [organizations.id],
  }),
  conversions: many(chatConversions),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  chats: many(chats),
  conversions: many(chatConversions),
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

export const chatConversionsRelations = relations(chatConversions, ({ one }) => ({
  chat: one(chats, {
    fields: [chatConversions.chatId],
    references: [chats.id],
  }),
  organization: one(organizations, {
    fields: [chatConversions.organizationId],
    references: [organizations.id],
  }),
}));




