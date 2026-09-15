import { userService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const user = await userService.findById(actor.id);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return { id: user.id, email: user.email, displayName: user.displayName, totpEnabled: user.totpEnabled };
});
