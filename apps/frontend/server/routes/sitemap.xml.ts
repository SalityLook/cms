import { contentService, seoService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const [posts, pages] = await Promise.all([
    contentService.list({ type: "post", status: "published" }),
    contentService.list({ type: "page", status: "published" })
  ]);
  const entries = await seoService.sitemapEntries([...posts, ...pages]);

  const urls = entries
    .map((entry) => `<url><loc>${siteUrl}${entry.path}</loc><lastmod>${entry.lastmod.toISOString()}</lastmod></url>`)
    .join("");

  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
});
