import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Cached by source URL -- oEmbed responses are stable and re-fetching on
 * every render/edit would be both slow and a good way to get rate-limited
 * by the provider. The sanitized HTML is what gets stored (and re-used
 * verbatim by BlockRenderer/Embed.vue), never the raw provider response.
 */
export const oembedCache = pgTable("oembed_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull().unique(),
  providerName: varchar("provider_name", { length: 100 }).notNull(),
  html: text("html").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
