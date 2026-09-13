import { roleService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");

  const roles = await roleService.listRoles();
  return Promise.all(
    roles.map(async (role) => ({
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      capabilities: await roleService.capabilitiesForRole(role.key)
    }))
  );
});
