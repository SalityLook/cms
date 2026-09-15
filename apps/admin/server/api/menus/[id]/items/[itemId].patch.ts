import { menuService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1).max(255).optional(),
  linkType: z.enum(["custom", "content"]).optional(),
  customUrl: z.string().trim().max(2048).nullable().optional(),
  contentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
  openInNewTab: z.boolean().optional()
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_menus");
  const itemId = getRouterParam(event, "itemId");
  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing item id" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);
  return menuService.updateItem(itemId, body);
});
