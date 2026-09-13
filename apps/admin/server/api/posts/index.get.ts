import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const statusSchema = z.enum(["draft", "pending", "scheduled", "published", "trashed"]).optional();

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const status = statusSchema.parse(getQuery(event).status);
  return contentService.list({ type: "post", status });
});
