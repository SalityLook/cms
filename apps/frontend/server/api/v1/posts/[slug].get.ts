import { contentService, taxonomyService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  // status is fixed to "published" no matter who's asking (even an
  // authenticated key with edit_posts) -- this API is read-only public
  // content, not a remote-authoring/preview surface.
  const post = await contentService.getBySlug("post", slug);
  if (!post || post.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  const terms = await taxonomyService.termsForContent(post.id);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    publishedAt: post.publishedAt,
    terms
  };
});
