import { contentMetaService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_pages");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  return contentMetaService.getAll(id);
});
