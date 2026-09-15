import { menuService } from "@selftaught/core/server";

// Public, unauthenticated -- read by the theme layout on every page render,
// same posture as GET /api/branding.
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");
  if (!key) {
    throw createError({ statusCode: 400, statusMessage: "Missing key" });
  }
  return menuService.resolveMenu(key);
});
