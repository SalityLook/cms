import { contentService, mediaService, seoService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const page = await contentService.getBySlug("page", slug);
  if (!page || page.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }

  const [featuredMedia, resolvedSeo] = await Promise.all([
    page.featuredMediaId ? mediaService.getByIdWithUrl(page.featuredMediaId) : null,
    seoService.resolve(page)
  ]);

  const seo = { ...resolvedSeo, ogImageUrl: resolvedSeo.ogImageUrl ?? featuredMedia?.url ?? null };
  const jsonLd = await seoService.generateJsonLd(page, seo);

  return { ...page, featuredMediaUrl: featuredMedia?.url ?? null, seo, jsonLd };
});
