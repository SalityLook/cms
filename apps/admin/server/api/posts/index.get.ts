import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_posts");
  return contentService.list({ type: "post" });
});
