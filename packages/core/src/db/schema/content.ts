import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import type { ContentDocument } from "../../shared/content-doc";
import { users } from "./users";

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "pending",
  "scheduled",
  "published",
  "trashed"
]);

export const content = pgTable(
  "content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content").notNull().$type<ContentDocument>(),
    contentHtml: text("content_html"),
    contentText: text("content_text"),
    status: contentStatusEnum("status").notNull().default("draft"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    featuredMediaId: uuid("featured_media_id"),
    parentId: uuid("parent_id").references((): AnyPgColumn => content.id),
    menuOrder: integer("menu_order").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("content_type_slug_unique").on(table.type, table.slug)]
);

export const contentMeta = pgTable(
  "content_meta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 100 }).notNull(),
    value: jsonb("value")
  },
  (table) => [uniqueIndex("content_meta_content_id_key_idx").on(table.contentId, table.key)]
);

export const contentRelations = relations(content, ({ one, many }) => ({
  author: one(users, { fields: [content.authorId], references: [users.id] }),
  parent: one(content, { fields: [content.parentId], references: [content.id], relationName: "contentParent" }),
  children: many(content, { relationName: "contentParent" }),
  meta: many(contentMeta)
}));

export const contentMetaRelations = relations(contentMeta, ({ one }) => ({
  content: one(content, { fields: [contentMeta.contentId], references: [content.id] })
}));
