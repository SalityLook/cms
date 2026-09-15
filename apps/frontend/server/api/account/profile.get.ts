import { mediaService, userService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const user = await userService.findById(session.user.id);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  const avatar = user.avatarMediaId ? await mediaService.getByIdWithUrl(user.avatarMediaId) : null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    slug: user.slug,
    avatarMediaId: user.avatarMediaId,
    avatarUrl: avatar?.url ?? null
  };
});
