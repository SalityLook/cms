import { jsonb, pgTable, varchar } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  // Nullable, deliberately: settings like siteLogoMediaId/defaultOgImageMediaId
  // are legitimately "cleared" back to null (e.g. deselecting a picker), and
  // drizzle-orm's jsonb mapToDriverValue is skipped for a JS `null` (it sends
  // raw SQL NULL rather than the JSON scalar "null") -- with `.notNull()`
  // that raw NULL violated the column constraint and 500'd. See CLAUDE.md
  // Gotcha #22.
  value: jsonb("value")
});
