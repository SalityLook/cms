import { roleService, userService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const user = await userService.findById(id);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  const roles = await roleService.rolesForUser(id);
  return { id: user.id, email: user.email, displayName: user.displayName, status: user.status, createdAt: user.createdAt, roles };
});
