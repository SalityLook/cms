import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async () => {
  return contentService.list({ type: "post", status: "published" });
});
