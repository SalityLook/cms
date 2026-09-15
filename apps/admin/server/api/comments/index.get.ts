import { commentService } from "@selftaught/core/server";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["pending", "approved", "spam", "trash"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "moderate_comments");
  const { status, search, page, limit } = querySchema.parse(getQuery(event));

  const filters = { status, search };
  const [items, total] = await Promise.all([
    commentService.list({ ...filters, limit, offset: (page - 1) * limit }),
    commentService.count(filters)
  ]);

  return { items, page, totalPages: Math.max(1, Math.ceil(total / limit)), total };
});
