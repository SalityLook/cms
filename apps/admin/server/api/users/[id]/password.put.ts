import { userService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  newPassword: z.string().min(8)
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { newPassword } = await readValidatedBody(event, bodySchema.parse);
  const user = await userService.setPassword(id, newPassword);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return { ok: true };
});
