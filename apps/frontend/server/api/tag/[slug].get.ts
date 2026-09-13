import { contentService, taxonomyService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug" });
  }

  const term = await taxonomyService.getTermBySlug("tag", slug);
  if (!term) {
    throw createError({ statusCode: 404, statusMessage: "Tag not found" });
  }

  const contentIds = await taxonomyService.contentIdsForTerm(term.id);
  const published = await contentService.list({ type: "post", status: "published" });
  const posts = published.filter((post) => contentIds.includes(post.id));

  return { term, posts };
});
