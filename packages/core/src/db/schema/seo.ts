import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { content } from "./content";

export const contentSeo = pgTable("content_seo", {
  contentId: uuid("content_id")
    .primaryKey()
    .references(() => content.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  ogImageMediaId: uuid("og_image_media_id"),
  canonicalUrl: text("canonical_url"),
  noindex: boolean("noindex").notNull().default(false),
  structuredDataOverride: jsonb("structured_data_override"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const contentSeoRelations = relations(contentSeo, ({ one }) => ({
  content: one(content, { fields: [contentSeo.contentId], references: [content.id] })
}));
