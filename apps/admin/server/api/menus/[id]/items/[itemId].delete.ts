import { menuService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_menus");
  const itemId = getRouterParam(event, "itemId");
  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing item id" });
  }

  await menuService.deleteItem(itemId);
  return { ok: true };
});
