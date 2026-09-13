import { roleService, userService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  roleKeys: z.array(z.string()).default([])
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");

  const body = await readValidatedBody(event, bodySchema.parse);

  const existing = await userService.findByEmail(body.email);
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Email already in use" });
  }

  const user = await userService.create({ email: body.email, password: body.password, displayName: body.displayName });
  if (!user) {
    throw createError({ statusCode: 500, statusMessage: "Failed to create user" });
  }

  if (body.roleKeys.length > 0) {
    await roleService.setRolesForUser(user.id, body.roleKeys);
  }

  return { id: user.id, email: user.email, displayName: user.displayName, status: user.status };
});
