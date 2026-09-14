import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["draft", "pending", "scheduled", "published", "trashed"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(200)
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const { status, search, page, limit } = querySchema.parse(getQuery(event));

  const filters = { type: "post", status, search };
  const [items, total] = await Promise.all([
    contentService.list({ ...filters, limit, offset: (page - 1) * limit }),
    contentService.count(filters)
  ]);

  return { items, page, totalPages: Math.max(1, Math.ceil(total / limit)), total };
});
