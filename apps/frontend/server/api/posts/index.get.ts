import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const PAGE_SIZE = 10;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export default defineEventHandler(async (event) => {
  const { page, limit } = querySchema.parse(getQuery(event));
  const pageSize = limit ?? PAGE_SIZE;

  const [rawPosts, total] = await Promise.all([
    contentService.list({ type: "post", status: "published", limit: pageSize, offset: (page - 1) * pageSize }),
    contentService.count({ type: "post", status: "published" })
  ]);
  const posts = await enrichPostsForCards(rawPosts);

  return { posts, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
});
