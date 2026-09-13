import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  return contentService.unpublish(actor, id);
});
