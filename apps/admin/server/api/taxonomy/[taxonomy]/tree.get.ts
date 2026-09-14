import { taxonomyService } from "@selftaught/core/server";

// Separate from index.get.ts (flat list, used by the post/page editor's
// category/tag toggle buttons) -- the admin TaxonomyManager UI needs the
// nested parent/child tree specifically for rendering indentation.
export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_categories");
  const taxonomy = getRouterParam(event, "taxonomy");
  if (!taxonomy) {
    throw createError({ statusCode: 400, statusMessage: "Missing taxonomy" });
  }

  return taxonomyService.listTree(taxonomy);
});
