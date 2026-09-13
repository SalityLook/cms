import { permissionService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/")) {
    return;
  }

  const session = await getUserSession(event);
  if (!session.user) {
    return;
  }

  event.context.actor = await permissionService.loadActor(session.user.id);
});
