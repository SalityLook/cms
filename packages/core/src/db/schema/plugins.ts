import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Seeded/upserted at boot (server/plugins/00.load-plugins.ts) for every
 * entry in plugins.config.ts, so a first-party plugin like example-plugin
 * keeps working with zero admin action after a fresh deploy. `enabled`
 * is the only thing an admin can actually change at runtime -- see the
 * Phase 21 CLAUDE.md notes on why that only takes effect after a restart.
 */
export const installedPlugins = pgTable("installed_plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
