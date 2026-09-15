import { commentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ status: z.enum(["pending", "approved", "spam", "trash"]) });

export default defineApiHandler(async (event) => {
  requireCapability(event, "moderate_comments");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { status } = await readValidatedBody(event, bodySchema.parse);
  return commentService.updateStatus(id, status);
});
