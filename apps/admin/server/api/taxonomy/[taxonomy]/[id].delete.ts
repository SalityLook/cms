import { taxonomyService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_categories");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  await taxonomyService.deleteTerm(id);
  return { ok: true };
});
