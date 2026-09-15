import { pluginService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_plugins");
  return pluginService.list();
});
