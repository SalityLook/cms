import { reusableBlockService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  await reusableBlockService.delete(id);
  return { ok: true };
});
