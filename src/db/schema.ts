import { boolean, index, integer, json, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


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

export const chatsRelations = relations(chats, ({ one }) => ({
  organization: one(organizations, {
    fields: [chats.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  chats: many(chats),
}));




