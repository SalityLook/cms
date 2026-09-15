import { totpService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  return totpService.startSetup(actor.id, actor.email);
});
