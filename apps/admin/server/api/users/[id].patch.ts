import { roleService, userService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  displayName: z.string().min(1).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  roleKeys: z.array(z.string()).optional()
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);

  if (body.displayName !== undefined) {
    await userService.updateProfile(id, { displayName: body.displayName });
  }
  if (body.status !== undefined) {
    await userService.setStatus(id, body.status);
  }
  if (body.roleKeys !== undefined) {
    await roleService.setRolesForUser(id, body.roleKeys);
  }

  const user = await userService.findById(id);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  const roles = await roleService.rolesForUser(id);
  return { id: user.id, email: user.email, displayName: user.displayName, status: user.status, roles };
});
