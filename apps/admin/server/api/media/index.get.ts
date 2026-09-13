import { mediaService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_media");
  return mediaService.list();
});
