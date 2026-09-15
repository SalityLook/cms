import { commentService } from "@selftaught/core/server";
import { z } from "zod";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 5;

const bodySchema = z.object({
  contentId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  authorName: z.string().trim().min(1).max(255),
  authorEmail: z.string().trim().email().max(255),
  body: z.string().trim().min(1).max(5000)
});

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  if (!checkRateLimit(`comment:ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many comments submitted. Try again later." });
  }

  const input = await readValidatedBody(event, bodySchema.parse);

  try {
    const comment = await commentService.create({
      ...input,
      authorIp: ip,
      userAgent: getHeader(event, "user-agent")
    });
    return { id: comment.id, status: comment.status };
  } catch (err) {
    // NotFoundError (content not published/doesn't exist) and
    // ValidationError (bad parentId) both need real status codes here --
    // apps/frontend has no defineApiHandler (that's an apps/admin-only
    // pattern, see Gotcha #17), so map them inline.
    const name = err instanceof Error ? err.name : "";
    if (name === "NotFoundError") {
      throw createError({ statusCode: 404, statusMessage: (err as Error).message });
    }
    if (name === "ValidationError") {
      throw createError({ statusCode: 400, statusMessage: (err as Error).message });
    }
    throw err;
  }
});
