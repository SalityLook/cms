import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Keys are formatted "<keyId>.<secret>" -- keyId is plaintext and unique
 * (indexed lookup), secret is argon2-hashed like a password. This avoids
 * having to argon2.verify() against every row in the table on each
 * request; the incoming key's keyId segment picks the one row to check.
 * The raw key is shown to the user exactly once at creation and never
 * stored or retrievable again, same posture as a recovery code (Phase 22).
 */
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  keyId: varchar("key_id", { length: 32 }).notNull().unique(),
  secretHash: varchar("secret_hash", { length: 255 }).notNull(),
  scopes: jsonb("scopes").notNull().$type<string[]>(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true })
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] })
}));
