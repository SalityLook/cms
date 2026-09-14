import { contentMetaService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  const key = getRouterParam(event, "key");
  if (!id || !key) {
    throw createError({ statusCode: 400, statusMessage: "Missing id or key" });
  }

  await contentMetaService.delete(id, key);
  return { ok: true };
});
