import { taxonomyService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_categories");
  const taxonomy = getRouterParam(event, "taxonomy");
  if (!taxonomy) {
    throw createError({ statusCode: 400, statusMessage: "Missing taxonomy" });
  }

  return taxonomyService.listByTaxonomy(taxonomy);
});
