import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const post = await contentService.getById(id);
  if (!post || post.type !== "post") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  return post;
});
