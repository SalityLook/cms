import { contentService, mediaService, userService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const user = await userService.findBySlug(slug);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Author not found" });
  }

  const [posts, avatar] = await Promise.all([
    contentService.list({ type: "post", status: "published", authorId: user.id, limit: 50 }),
    user.avatarMediaId ? mediaService.getByIdWithUrl(user.avatarMediaId) : null
  ]);

  return {
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: avatar?.url ?? null,
    posts: posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, publishedAt: p.publishedAt }))
  };
});
