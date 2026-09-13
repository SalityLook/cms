import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { contentSeo } from "../../db/schema/seo";
import type { MediaService } from "../media/media-service";
import type { SettingsService } from "../settings/settings-service";

export interface ContentSeoInput {
  title?: string | null;
  description?: string | null;
  ogImageMediaId?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
  structuredDataOverride?: Record<string, unknown> | null;
}

export interface ResolvedSeo {
  title: string;
  description: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
}

export interface SeoSourceContent {
  id: string;
  type: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
}

export interface SitemapContentInput {
  id: string;
  type: string;
  slug: string;
  updatedAt: Date;
}

export interface SitemapEntry {
  path: string;
  lastmod: Date;
}

export class SeoService {
  constructor(
    private readonly db: Database,
    private readonly mediaService: MediaService,
    private readonly settingsService: SettingsService
  ) {}

  getForContent(contentId: string) {
    return this.db.query.contentSeo.findFirst({ where: eq(contentSeo.contentId, contentId) });
  }

  async upsert(contentId: string, input: ContentSeoInput): Promise<void> {
    await this.db
      .insert(contentSeo)
      .values({ contentId, ...input, updatedAt: new Date() })
      .onConflictDoUpdate({ target: contentSeo.contentId, set: { ...input, updatedAt: new Date() } });
  }

  async resolve(content: SeoSourceContent): Promise<ResolvedSeo> {
    const [seo, siteDescription, defaultOgImageId] = await Promise.all([
      this.getForContent(content.id),
      this.settingsService.get<string>("siteDescription"),
      this.settingsService.get<string>("defaultOgImageMediaId")
    ]);

    const ogImageId = seo?.ogImageMediaId ?? defaultOgImageId ?? null;
    const ogImage = ogImageId ? await this.mediaService.getByIdWithUrl(ogImageId) : null;

    return {
      title: seo?.title || content.title,
      description: seo?.description || content.excerpt || siteDescription || null,
      ogImageUrl: ogImage?.url ?? null,
      canonicalUrl: seo?.canonicalUrl || null,
      noindex: seo?.noindex ?? false
    };
  }

  async generateJsonLd(content: SeoSourceContent, resolved: ResolvedSeo): Promise<Record<string, unknown>> {
    const seo = await this.getForContent(content.id);

    const base: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": content.type === "post" ? "BlogPosting" : "WebPage",
      headline: resolved.title
    };
    if (resolved.description) base.description = resolved.description;
    if (resolved.ogImageUrl) base.image = resolved.ogImageUrl;
    if (content.publishedAt) base.datePublished = content.publishedAt.toISOString();
    base.dateModified = content.updatedAt.toISOString();

    return { ...base, ...((seo?.structuredDataOverride as Record<string, unknown> | null) ?? {}) };
  }

  async sitemapEntries(items: SitemapContentInput[]): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [];
    for (const item of items) {
      const seo = await this.getForContent(item.id);
      if (seo?.noindex) continue;
      const path = item.type === "post" ? `/blog/${item.slug}` : `/${item.slug}`;
      entries.push({ path, lastmod: item.updatedAt });
    }
    return entries;
  }
}
