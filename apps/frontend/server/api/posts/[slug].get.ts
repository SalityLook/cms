import { commentService, contentService, mediaService, seoService, settingsService, taxonomyService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const post = await contentService.getBySlug("post", slug);
  if (!post || post.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  const [terms, featuredMedia, resolvedSeo, commentsEnabled] = await Promise.all([
    taxonomyService.termsForContent(post.id),
    post.featuredMediaId ? mediaService.getByIdWithUrl(post.featuredMediaId) : null,
    seoService.resolve(post),
    settingsService.get<boolean>("commentsEnabled")
  ]);

  const seo = { ...resolvedSeo, ogImageUrl: resolvedSeo.ogImageUrl ?? featuredMedia?.url ?? null };
  const jsonLd = await seoService.generateJsonLd(post, seo);
  const comments = commentsEnabled ? await commentService.listForContent(post.id) : [];

  return { ...post, terms, featuredMediaUrl: featuredMedia?.url ?? null, seo, jsonLd, comments, commentsEnabled: Boolean(commentsEnabled) };
});
