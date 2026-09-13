import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const post = await contentService.getBySlug("post", slug);
  if (!post || post.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  return post;
});
