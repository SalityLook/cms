import { totpService } from "@selftaught/core/server";

// Admin-initiated recovery path (e.g. a user lost their device AND their
// recovery codes) -- mirrors the existing PUT /api/users/[id]/password
// admin-reset flow, gated on the same capability.
export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_users");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  await totpService.disable(id);
  return { ok: true };
});
