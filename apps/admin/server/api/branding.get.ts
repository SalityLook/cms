import { mediaService, settingsService } from "@selftaught/core/server";

// Deliberately UNAUTHENTICATED (no requireCapability) -- this is read by the
// login page (before any session exists) and by every layout render, unlike
// GET /api/settings which requires manage_settings and returns everything.
// Only exposes the handful of fields that are safe/necessary to be public.
export default defineEventHandler(async (event) => {
  const settingsMap = await settingsService.getAll();
  const logoMediaId = settingsMap.siteLogoMediaId as string | null | undefined;
  const faviconMediaId = settingsMap.siteFaviconMediaId as string | null | undefined;

  const [logo, favicon] = await Promise.all([
    logoMediaId ? mediaService.getByIdWithUrl(logoMediaId) : null,
    faviconMediaId ? mediaService.getByIdWithUrl(faviconMediaId) : null
  ]);

  return {
    siteName: (settingsMap.siteName as string) || "SelfTaught",
    logoUrl: logo?.url ?? null,
    faviconUrl: favicon?.url ?? null
  };
});
