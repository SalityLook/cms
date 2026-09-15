import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const page = await contentService.getBySlug("page", slug);
  if (!page || page.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }

  return { id: page.id, slug: page.slug, title: page.title, excerpt: page.excerpt, content: page.content };
});
