import { apiKeyService, permissionService } from "@selftaught/core/server";

/**
 * Only touches /api/v1/** -- every other route in this app (blog pages,
 * comments, register/login, etc.) is untouched by this middleware. A
 * missing or invalid key is NOT rejected here: v1's read endpoints are
 * intentionally open without a key (parity with what's already public),
 * only POST /api/v1/comments actually requires event.context.apiKey to
 * be set, and rejects there if it's absent.
 */
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/v1/")) {
    return;
  }

  const authHeader = getHeader(event, "authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return;
  }

  const rawKey = authHeader.slice("Bearer ".length).trim();
  const result = await apiKeyService.verify(rawKey);
  if (!result) {
    return;
  }

  const actor = await permissionService.loadActor(result.userId);
  if (!actor) {
    return;
  }

  event.context.apiKey = { userId: result.userId, scopes: result.scopes, keyRowId: result.keyRowId, actor };
});
