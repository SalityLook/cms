import { permissionService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const actor = await permissionService.loadActor(session.user.id);
  if (!actor) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  return actor;
});
