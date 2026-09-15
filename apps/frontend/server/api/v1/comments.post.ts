import { commentService } from "@selftaught/core/server";
import { z } from "zod";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_KEY = 20;

const bodySchema = z.object({
  contentId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  body: z.string().trim().min(1).max(5000)
});

// Authenticated-only (unlike the public POST /api/comments) -- attributed
// to the API key's owning user, not to freeform author name/email fields.
export default defineEventHandler(async (event) => {
  const apiKey = event.context.apiKey;
  if (!apiKey) {
    throw createError({ statusCode: 401, statusMessage: "A valid API key is required for this endpoint" });
  }

  // Per-API-key, not per-IP/email -- a legitimate integration can share an
  // egress IP with other traffic, so IP-based limiting isn't the right
  // dimension here the way it is for the public anonymous comment form.
  if (!checkRateLimit(`v1:comments:key:${apiKey.keyRowId}`, MAX_ATTEMPTS_PER_KEY, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many comments submitted. Try again later." });
  }

  const input = await readValidatedBody(event, bodySchema.parse);

  try {
    const comment = await commentService.create({
      ...input,
      authorName: apiKey.actor.displayName,
      authorEmail: apiKey.actor.email,
      authorUserId: apiKey.actor.id
    });
    return { id: comment.id, status: comment.status };
  } catch (err) {
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
