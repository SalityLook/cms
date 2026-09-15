import { commentService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "moderate_comments");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  await commentService.delete(id);
  return { ok: true };
});
