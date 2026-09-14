import { mediaService } from "@selftaught/core/server";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(200)
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_media");
  const { search, page, limit } = querySchema.parse(getQuery(event));

  const filters = { search };
  const [items, total] = await Promise.all([
    mediaService.list({ ...filters, limit, offset: (page - 1) * limit }),
    mediaService.count(filters)
  ]);

  return { items, page, totalPages: Math.max(1, Math.ceil(total / limit)), total };
});
