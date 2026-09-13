import { settingsService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const discourage = await settingsService.get<boolean>("discourageSearchEngines");

  setHeader(event, "content-type", "text/plain; charset=utf-8");

  if (discourage) {
    return "User-agent: *\nDisallow: /\n";
  }

  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
});
