import { apiKeyService } from "@selftaught/core/server";

export default defineEventHandler((event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  return apiKeyService.listForUser(actor.id);
});
