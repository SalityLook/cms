import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { ContentDocument } from "../../shared/content-doc";
import { content } from "./content";
import { users } from "./users";

export const revisionTypeEnum = pgEnum("revision_type", ["revision", "autosave"]);

export const revisions = pgTable("revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: jsonb("content").notNull().$type<ContentDocument>(),
  revisionType: revisionTypeEnum("revision_type").notNull().default("revision"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const revisionsRelations = relations(revisions, ({ one }) => ({
  content: one(content, { fields: [revisions.contentId], references: [content.id] }),
  author: one(users, { fields: [revisions.authorId], references: [users.id] })
}));
