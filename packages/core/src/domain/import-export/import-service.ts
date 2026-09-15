import { XMLParser } from "fast-xml-parser";
import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { comments } from "../../db/schema/comments";
import { media } from "../../db/schema/media";
import type { ContentService, ContentStatus } from "../content/content-service";
import type { TaxonomyService } from "../taxonomy/taxonomy-service";
import type { Actor } from "../../shared/types";
import type { ContentDocument } from "../../shared/content-doc";
import type { ExportBundle } from "./export-service";

export interface ImportPreview {
  content: { total: number; toCreate: number; toSkip: number };
  terms: { total: number };
  media: { total: number };
  comments: { total: number };
}

export interface ImportResult {
  content: { created: number; skipped: number };
  terms: { created: number; skipped: number };
  media: { created: number };
  comments: { created: number; skipped: number };
}

/** Naive, explicitly lossy HTML->block conversion for WXR import -- splits on top-level <p>/<h1-6> tags and strips all other markup to plain text. Does NOT attempt to preserve WordPress shortcodes, galleries, or Gutenberg blocks. */
function htmlToBlocks(html: string): ContentDocument {
  const blocks: ContentDocument["content"] = [];
  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

  const tagPattern = /<(h[1-6]|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  let matched = false;
  while ((match = tagPattern.exec(html))) {
    matched = true;
    const [, tag, inner] = match;
    const text = stripTags(inner ?? "");
    if (!text || !tag) continue;
    if (tag.startsWith("h")) {
      blocks.push({ type: "heading", attrs: { level: Number(tag[1]) }, content: [{ type: "text", text }] });
    } else {
      blocks.push({ type: "paragraph", content: [{ type: "text", text }] });
    }
  }
  if (!matched) {
    const text = stripTags(html);
    if (text) blocks.push({ type: "paragraph", content: [{ type: "text", text }] });
  }
  return { version: 1, type: "doc", content: blocks };
}

export class ImportService {
  constructor(
    private readonly db: Database,
    private readonly contentService: ContentService,
    private readonly taxonomyService: TaxonomyService
  ) {}

  async previewJson(bundle: ExportBundle): Promise<ImportPreview> {
    let toSkip = 0;
    for (const c of bundle.content) {
      const existing = await this.contentService.getBySlug(c.type, c.slug);
      if (existing) toSkip++;
    }
    return {
      content: { total: bundle.content.length, toCreate: bundle.content.length - toSkip, toSkip },
      terms: { total: bundle.terms.length },
      media: { total: bundle.media.length },
      comments: { total: bundle.comments.length }
    };
  }

  async importJson(actor: Actor, bundle: ExportBundle): Promise<ImportResult> {
    let termsCreated = 0;
    let termsSkipped = 0;
    const termIdByKey = new Map<string, string>();

    for (const t of bundle.terms) {
      const existing = await this.taxonomyService.getTermBySlug(t.taxonomy, t.slug);
      if (existing) {
        termsSkipped++;
        termIdByKey.set(`${t.taxonomy}:${t.slug}`, existing.id);
        continue;
      }
      const created = await this.taxonomyService.createTerm({
        taxonomy: t.taxonomy,
        slug: t.slug,
        name: t.name,
        description: t.description ?? undefined
      });
      termIdByKey.set(`${t.taxonomy}:${t.slug}`, created.id);
      termsCreated++;
    }
    for (const t of bundle.terms) {
      if (!t.parentSlug) continue;
      const id = termIdByKey.get(`${t.taxonomy}:${t.slug}`);
      const parentId = termIdByKey.get(`${t.taxonomy}:${t.parentSlug}`);
      if (id && parentId && id !== parentId) {
        await this.taxonomyService.updateTerm(id, { parentId });
      }
    }

    let mediaCreated = 0;
    const mediaIdByFileName = new Map<string, string>();
    for (const m of bundle.media) {
      const existing = await this.db.query.media.findFirst({ where: eq(media.fileName, m.fileName) });
      if (existing) {
        mediaIdByFileName.set(m.fileName, existing.id);
        continue;
      }
      const [row] = await this.db
        .insert(media)
        .values({ ...m, uploadedById: actor.id })
        .returning();
      if (row) {
        mediaIdByFileName.set(m.fileName, row.id);
        mediaCreated++;
      }
    }

    let contentCreated = 0;
    let contentSkipped = 0;
    const contentIdByKey = new Map<string, string>();

    for (const c of bundle.content) {
      const existing = await this.contentService.getBySlug(c.type, c.slug);
      if (existing) {
        contentSkipped++;
        contentIdByKey.set(`${c.type}:${c.slug}`, existing.id);
        continue;
      }

      const created = await this.contentService.create(actor, {
        type: c.type,
        slug: c.slug,
        title: c.title,
        excerpt: c.excerpt ?? undefined,
        content: c.content,
        menuOrder: c.menuOrder
      });

      const featuredMediaId = c.featuredMediaFileName ? mediaIdByFileName.get(c.featuredMediaFileName) : undefined;
      if (featuredMediaId) {
        await this.contentService.update(actor, created.id, { featuredMediaId });
      }
      if (c.status !== "draft") {
        await this.contentService.setStatusUnchecked(
          created.id,
          c.status as ContentStatus,
          c.publishedAt ? new Date(c.publishedAt) : null
        );
      }
      if (c.terms.length > 0) {
        const termIds = c.terms
          .map((t) => termIdByKey.get(`${t.taxonomy}:${t.slug}`))
          .filter((id): id is string => Boolean(id));
        if (termIds.length > 0) {
          await this.taxonomyService.assignTerms(created.id, termIds);
        }
      }

      contentIdByKey.set(`${c.type}:${c.slug}`, created.id);
      contentCreated++;
    }
    for (const c of bundle.content) {
      if (!c.parentSlug) continue;
      const id = contentIdByKey.get(`${c.type}:${c.slug}`);
      const parentId = contentIdByKey.get(`${c.type}:${c.parentSlug}`);
      if (id && parentId && id !== parentId) {
        await this.contentService.update(actor, id, { parentId });
      }
    }

    // Two-pass so a reply's parentIndex (referring to another comment's
    // position in the SAME export array) can be resolved regardless of
    // ordering. Written directly to the table (bypassing
    // CommentService.create()'s public-submission published-content guard)
    // since this is a trusted bulk restore, not a public submission --
    // historical comments on content that has since been unpublished are
    // still valid data to restore.
    let commentsCreated = 0;
    let commentsSkipped = 0;
    const commentIdByIndex = new Map<number, string>();
    for (let i = 0; i < bundle.comments.length; i++) {
      const cm = bundle.comments[i]!;
      const contentId = contentIdByKey.get(`${cm.contentType}:${cm.contentSlug}`);
      if (!contentId) continue; // dangling reference (source content wasn't imported) -- skip

      const createdAt = new Date(cm.createdAt);
      // No natural unique key on comments -- dedup on the combination that
      // realistically identifies "the same comment" across re-imports, so
      // importing the same export twice doesn't duplicate every comment.
      const existing = await this.db.query.comments.findFirst({
        where: and(
          eq(comments.contentId, contentId),
          eq(comments.authorEmail, cm.authorEmail),
          eq(comments.body, cm.body),
          eq(comments.createdAt, createdAt)
        )
      });
      if (existing) {
        commentsSkipped++;
        commentIdByIndex.set(i, existing.id);
        continue;
      }

      const [row] = await this.db
        .insert(comments)
        .values({
          contentId,
          authorName: cm.authorName,
          authorEmail: cm.authorEmail,
          body: cm.body,
          status: cm.status as (typeof comments.$inferInsert)["status"],
          createdAt
        })
        .returning();
      if (row) {
        commentIdByIndex.set(i, row.id);
        commentsCreated++;
      }
    }
    for (let i = 0; i < bundle.comments.length; i++) {
      const cm = bundle.comments[i]!;
      if (cm.parentIndex === null || cm.parentIndex === undefined) continue;
      const id = commentIdByIndex.get(i);
      const parentId = commentIdByIndex.get(cm.parentIndex);
      if (id && parentId) {
        await this.db.update(comments).set({ parentId }).where(eq(comments.id, id));
      }
    }

    return {
      content: { created: contentCreated, skipped: contentSkipped },
      terms: { created: termsCreated, skipped: termsSkipped },
      media: { created: mediaCreated },
      comments: { created: commentsCreated, skipped: commentsSkipped }
    };
  }

  /**
   * WordPress WXR export XML -> ExportBundle-shaped content list, funneled
   * through the SAME importJson() content-creation path. Explicitly
   * best-effort/lossy: only post/page items are imported (attachments, nav
   * menu items, etc. are skipped), body HTML is converted to paragraph/
   * heading blocks ONLY via htmlToBlocks() (shortcodes, galleries, and any
   * real Gutenberg block markup are flattened to plain text or dropped),
   * and category HIERARCHY, attachment featured-images, postmeta, and
   * author mapping are NOT preserved -- category/tag NAMES are, everything
   * else about them is not.
   */
  async importWxr(actor: Actor, xml: string): Promise<ImportResult> {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const doc = parser.parse(xml);
    const rawItems: unknown = doc?.rss?.channel?.item;
    const items: Record<string, unknown>[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const bundle: ExportBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      media: [],
      terms: [],
      content: [],
      comments: []
    };

    const seenTerms = new Set<string>();

    for (const item of items) {
      const postType = String((item["wp:post_type"] as string) ?? "");
      if (postType !== "post" && postType !== "page") continue;

      const wpStatus = String((item["wp:status"] as string) ?? "draft");
      const status = wpStatus === "publish" ? "published" : wpStatus === "private" ? "published" : "draft";
      const slug = String((item["wp:post_name"] as string) ?? "").trim();
      const title = String(item.title ?? "(Tanpa judul)");
      if (!slug) continue; // can't import without a stable slug key

      const html = String(item["content:encoded"] ?? "");
      const rawCategories = item.category;
      const categoryList = Array.isArray(rawCategories) ? rawCategories : rawCategories ? [rawCategories] : [];
      const terms: { taxonomy: string; slug: string }[] = [];
      for (const cat of categoryList as Record<string, unknown>[]) {
        const domain = String(cat["@_domain"] ?? "");
        const taxonomy = domain === "post_tag" ? "tag" : domain === "category" ? "category" : "";
        if (!taxonomy) continue;
        const catSlug = String(cat["@_nicename"] ?? "");
        const catName = String(cat["#text"] ?? catSlug);
        if (!catSlug) continue;
        terms.push({ taxonomy, slug: catSlug });
        const key = `${taxonomy}:${catSlug}`;
        if (!seenTerms.has(key)) {
          seenTerms.add(key);
          bundle.terms.push({ taxonomy, slug: catSlug, name: catName, description: null, parentSlug: null });
        }
      }

      bundle.content.push({
        type: postType,
        slug,
        title,
        excerpt: null,
        content: htmlToBlocks(html),
        status,
        featuredMediaFileName: null,
        parentSlug: null,
        menuOrder: 0,
        publishedAt: status === "published" ? new Date().toISOString() : null,
        terms
      });
    }

    return this.importJson(actor, bundle);
  }
}
