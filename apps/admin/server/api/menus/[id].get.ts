import { menuService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_menus");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const menu = await menuService.getMenuById(id);
  if (!menu) {
    throw createError({ statusCode: 404, statusMessage: "Menu not found" });
  }
  const items = await menuService.listItems(id);
  return { menu, items };
});
