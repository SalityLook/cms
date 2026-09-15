import { relations } from "drizzle-orm";
import { type AnyPgColumn, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { content } from "./content";
import { users } from "./users";

export const commentStatusEnum = pgEnum("comment_status", ["pending", "approved", "spam", "trash"]);

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }).notNull(),
  authorUserId: uuid("author_user_id").references(() => users.id),
  body: text("body").notNull(),
  status: commentStatusEnum("status").notNull().default("pending"),
  authorIp: varchar("author_ip", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  content: one(content, { fields: [comments.contentId], references: [content.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "commentParent" }),
  replies: many(comments, { relationName: "commentParent" }),
  authorUser: one(users, { fields: [comments.authorUserId], references: [users.id] })
}));
