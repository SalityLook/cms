import { reusableBlockService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const block = await reusableBlockService.getById(id);
  if (!block) {
    throw createError({ statusCode: 404, statusMessage: "Reusable block not found" });
  }
  return block;
});
