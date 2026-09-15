import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { content } from "./content";

export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull()
});

export const menuItemLinkTypeEnum = pgEnum("menu_item_link_type", ["custom", "content"]);

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id, { onDelete: "cascade" }),
  // One level of nesting only (dropdown) -- deliberately not a full
  // self-referencing tree like terms.parentId, since a nav menu with more
  // than 2 levels is a UX smell anyway. No onDelete cascade on parentId:
  // deleting a parent item should not silently vaporize its children,
  // MenuService guards this the same way TaxonomyService guards categories
  // with subcategories (Phase 11).
  parentId: uuid("parent_id"),
  label: varchar("label", { length: 255 }).notNull(),
  linkType: menuItemLinkTypeEnum("link_type").notNull().default("custom"),
  customUrl: varchar("custom_url", { length: 2048 }),
  contentId: uuid("content_id").references(() => content.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  openInNewTab: boolean("open_in_new_tab").notNull().default(false)
});

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems)
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, { fields: [menuItems.menuId], references: [menus.id] }),
  content: one(content, { fields: [menuItems.contentId], references: [content.id] })
}));
