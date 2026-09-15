import { menuService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_menus");
  return menuService.listMenus();
});
