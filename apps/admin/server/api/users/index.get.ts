import { roleService, userService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");

  const users = await userService.list();
  return Promise.all(
    users.map(async (user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
      roles: await roleService.rolesForUser(user.id)
    }))
  );
});
