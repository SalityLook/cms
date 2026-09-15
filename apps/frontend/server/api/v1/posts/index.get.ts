import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const PAGE_SIZE = 20;

// Deliberately NO status/type override in the query schema -- status is
// hardcoded "published" below regardless of what's sent, and there is no
// way for any query param combination (with or without an API key) to
// surface a draft/scheduled/trashed row through this endpoint.
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export default defineEventHandler(async (event) => {
  const { page, limit } = querySchema.parse(getQuery(event));
  const pageSize = limit ?? PAGE_SIZE;

  const [posts, total] = await Promise.all([
    contentService.list({ type: "post", status: "published", limit: pageSize, offset: (page - 1) * pageSize }),
    contentService.count({ type: "post", status: "published" })
  ]);

  return {
    posts: posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, publishedAt: p.publishedAt })),
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    total
  };
});
