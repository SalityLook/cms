import { seoService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const seo = await seoService.getForContent(id);
  return seo ?? null;
});
