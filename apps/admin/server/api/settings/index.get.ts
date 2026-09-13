import { settingsService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_settings");
  return settingsService.getAll();
});
