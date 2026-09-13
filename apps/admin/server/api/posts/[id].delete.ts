import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const actor = requireCapability(event, "delete_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  await contentService.delete(actor, id);
  return { ok: true };
});
