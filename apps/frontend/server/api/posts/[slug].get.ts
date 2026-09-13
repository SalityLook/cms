import { contentService, mediaService, taxonomyService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const post = await contentService.getBySlug("post", slug);
  if (!post || post.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  const [terms, featuredMedia] = await Promise.all([
    taxonomyService.termsForContent(post.id),
    post.featuredMediaId ? mediaService.getByIdWithUrl(post.featuredMediaId) : null
  ]);

  return { ...post, terms, featuredMediaUrl: featuredMedia?.url ?? null };
});
