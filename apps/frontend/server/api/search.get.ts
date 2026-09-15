import { searchService } from "@selftaught/core/server";
import { z } from "zod";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_IP = 30;

const querySchema = z.object({
  q: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).default(1),
  type: z.enum(["post", "page"]).optional()
});

const PAGE_SIZE = 10;

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  if (!checkRateLimit(`search:ip:${ip}`, MAX_REQUESTS_PER_IP, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many search requests. Try again later." });
  }

  const { q, page, type } = await getValidatedQuery(event, querySchema.parse);

  const { results, total } = await searchService.search(q, {
    type,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  });

  return {
    results,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total
  };
});
