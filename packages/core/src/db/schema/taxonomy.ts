import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { content } from "./content";

export const terms = pgTable(
  "terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taxonomy: varchar("taxonomy", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    parentId: uuid("parent_id").references((): AnyPgColumn => terms.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("terms_taxonomy_slug_unique").on(table.taxonomy, table.slug)]
);

export const contentTerms = pgTable(
  "content_terms",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" })
  },
  (table) => [primaryKey({ columns: [table.contentId, table.termId] })]
);

export const termsRelations = relations(terms, ({ one, many }) => ({
  parent: one(terms, { fields: [terms.parentId], references: [terms.id], relationName: "termParent" }),
  children: many(terms, { relationName: "termParent" }),
  contentTerms: many(contentTerms)
}));

export const contentTermsRelations = relations(contentTerms, ({ one }) => ({
  content: one(content, { fields: [contentTerms.contentId], references: [content.id] }),
  term: one(terms, { fields: [contentTerms.termId], references: [terms.id] })
}));
