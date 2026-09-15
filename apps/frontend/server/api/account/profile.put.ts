import { userService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(255).optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  avatarMediaId: z.string().uuid().nullable().optional()
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  const user = await userService.updateProfile(session.user.id, body);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  return { id: user.id, displayName: user.displayName, bio: user.bio, avatarMediaId: user.avatarMediaId };
});
