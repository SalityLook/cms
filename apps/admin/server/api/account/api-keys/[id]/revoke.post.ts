import { apiKeyService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  await apiKeyService.revoke(id, actor.id);
  return { ok: true };
});
