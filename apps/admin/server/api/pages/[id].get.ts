import { contentService, mediaService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_pages");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const page = await contentService.getById(id);
  if (!page || page.type !== "page") {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }

  const featuredMedia = page.featuredMediaId ? await mediaService.getByIdWithUrl(page.featuredMediaId) : null;
  return { ...page, featuredMediaUrl: featuredMedia?.url ?? null };
});
