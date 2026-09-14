import { mediaService, settingsService } from "@selftaught/core/server";

// Public, unauthenticated -- read by the theme layout on every page render.
// Mirrors apps/admin/server/api/branding.get.ts (same DB, same settings
// keys, but this is a separate Nitro process so it needs its own route).
export default defineEventHandler(async () => {
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
