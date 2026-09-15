import { exportService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_import_export");
  return exportService.exportAll();
});
