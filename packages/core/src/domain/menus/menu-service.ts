import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { menuItems, menus } from "../../db/schema/menus";
import { NotFoundError, ValidationError } from "../../errors";

export interface CreateMenuInput {
  key: string;
  name: string;
}

export interface CreateMenuItemInput {
  menuId: string;
  parentId?: string | null;
  label: string;
  linkType: "custom" | "content";
  customUrl?: string | null;
  contentId?: string | null;
  sortOrder?: number;
  openInNewTab?: boolean;
}

export type UpdateMenuItemInput = Partial<Omit<CreateMenuItemInput, "menuId">>;

export interface ResolvedMenuItem {
  id: string;
  label: string;
  url: string;
  openInNewTab: boolean;
  children: ResolvedMenuItem[];
}

export class MenuService {
  constructor(private readonly db: Database) {}

  listMenus() {
    return this.db.query.menus.findMany({ orderBy: [asc(menus.key)] });
  }

  async createMenu(input: CreateMenuInput) {
    const [row] = await this.db.insert(menus).values(input).returning();
    if (!row) {
      throw new Error("Failed to create menu");
    }
    return row;
  }

  getMenuByKey(key: string) {
    return this.db.query.menus.findFirst({ where: eq(menus.key, key) });
  }

  getMenuById(id: string) {
    return this.db.query.menus.findFirst({ where: eq(menus.id, id) });
  }

  async deleteMenu(id: string) {
    await this.db.delete(menus).where(eq(menus.id, id));
  }

  listItems(menuId: string) {
    return this.db.query.menuItems.findMany({
      where: eq(menuItems.menuId, menuId),
      orderBy: [asc(menuItems.sortOrder)]
    });
  }

  async createItem(input: CreateMenuItemInput) {
    if (input.linkType === "custom" && !input.customUrl) {
      throw new ValidationError("customUrl is required for a custom link");
    }
    if (input.linkType === "content" && !input.contentId) {
      throw new ValidationError("contentId is required for a content link");
    }
    const [row] = await this.db.insert(menuItems).values(input).returning();
    if (!row) {
      throw new Error("Failed to create menu item");
    }
    return row;
  }

  async updateItem(id: string, input: UpdateMenuItemInput) {
    const [row] = await this.db.update(menuItems).set(input).where(eq(menuItems.id, id)).returning();
    if (!row) {
      throw new NotFoundError("Menu item not found");
    }
    return row;
  }

  /** Guards against orphaning children the same way TaxonomyService guards categories with subcategories (Phase 11). */
  async deleteItem(id: string) {
    const children = await this.db.query.menuItems.findMany({
      where: eq(menuItems.parentId, id),
      columns: { id: true }
    });
    if (children.length > 0) {
      throw new ValidationError("Cannot delete a menu item that still has sub-items — move or delete them first");
    }
    await this.db.delete(menuItems).where(eq(menuItems.id, id));
  }

  /**
   * Resolves a menu by key into a public-render-ready tree, joining
   * linkType='content' items against the CURRENT content row so a link
   * stays correct even after the target's slug/title changes later --
   * that's the actual value over a hardcoded nav array. Same post-vs-page
   * URL convention as SeoService.sitemapEntries().
   */
  async resolveMenu(key: string): Promise<ResolvedMenuItem[]> {
    const menu = await this.getMenuByKey(key);
    if (!menu) return [];

    const items = await this.listItems(menu.id);
    const contentIds = items.map((i) => i.contentId).filter((id): id is string => Boolean(id));
    const contentRows =
      contentIds.length > 0 ? await this.db.query.content.findMany({ where: (c, { inArray }) => inArray(c.id, contentIds) }) : [];
    const contentById = new Map(contentRows.map((row) => [row.id, row]));

    function resolveUrl(item: (typeof items)[number]): string | null {
      if (item.linkType === "custom") return item.customUrl ?? null;
      const target = item.contentId ? contentById.get(item.contentId) : undefined;
      if (!target) return null;
      return target.type === "post" ? `/blog/${target.slug}` : `/${target.slug}`;
    }

    const byId = new Map<string, ResolvedMenuItem>();
    for (const item of items) {
      const url = resolveUrl(item);
      if (!url) continue; // dangling content reference (target deleted) -- skip rather than render a dead link
      byId.set(item.id, { id: item.id, label: item.label, url, openInNewTab: item.openInNewTab, children: [] });
    }

    const roots: ResolvedMenuItem[] = [];
    for (const item of items) {
      const resolved = byId.get(item.id);
      if (!resolved) continue;
      if (item.parentId && byId.has(item.parentId)) {
        byId.get(item.parentId)!.children.push(resolved);
      } else {
        roots.push(resolved);
      }
    }
    return roots;
  }
}
