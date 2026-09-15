import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import type { ContentDocument } from "../../shared/content-doc";
import { content } from "./content";
import { users } from "./users";

export const reusableBlocks = pgTable("reusable_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").notNull().$type<ContentDocument>(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

/**
 * Maintained by ContentService.create()/update() (a plain table write, no
 * ReusableBlockService dependency needed) every time a content document is
 * saved -- lets ReusableBlockService.delete() refuse to remove a block that
 * a post/page still references, instead of silently leaving a dangling
 * reusableBlockRef node behind.
 */
export const reusableBlockUsages = pgTable(
  "reusable_block_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reusableBlockId: uuid("reusable_block_id")
      .notNull()
      .references(() => reusableBlocks.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" })
  },
  (table) => [uniqueIndex("reusable_block_usages_unique").on(table.reusableBlockId, table.contentId)]
);

export const reusableBlocksRelations = relations(reusableBlocks, ({ many }) => ({
  usages: many(reusableBlockUsages)
}));

export const reusableBlockUsagesRelations = relations(reusableBlockUsages, ({ one }) => ({
  reusableBlock: one(reusableBlocks, { fields: [reusableBlockUsages.reusableBlockId], references: [reusableBlocks.id] }),
  content: one(content, { fields: [reusableBlockUsages.contentId], references: [content.id] })
}));
