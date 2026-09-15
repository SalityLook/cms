import type { Database } from "../../db/client";
import type { ContentDocument } from "../../shared/content-doc";

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  media: {
    fileName: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
    width: number | null;
    height: number | null;
    altText: string | null;
    caption: string | null;
    title: string | null;
  }[];
  terms: { taxonomy: string; slug: string; name: string; description: string | null; parentSlug: string | null }[];
  content: {
    type: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: ContentDocument;
    status: string;
    featuredMediaFileName: string | null;
    parentSlug: string | null;
    menuOrder: number;
    publishedAt: string | null;
    terms: { taxonomy: string; slug: string }[];
  }[];
  comments: {
    contentType: string;
    contentSlug: string;
    authorName: string;
    authorEmail: string;
    body: string;
    status: string;
    createdAt: string;
    parentIndex: number | null;
  }[];
}

/**
 * Scope v1 (see plan): metadata + storage-relative path only, no binary
 * media bundling -- a re-import on a DIFFERENT instance won't have the
 * actual files at that path, which is an accepted, documented limitation
 * (bundling file bytes is natural v2 scope if a school actually needs it).
 * Cross-references (parent content/terms, featured media, comment
 * threading) are all resolved by portable keys (slug, fileName, an array
 * ordinal) instead of database ids, which are never portable across a
 * delete-and-reimport cycle let alone a different instance.
 */
export class ExportService {
  constructor(private readonly db: Database) {}

  async exportAll(): Promise<ExportBundle> {
    const [allContent, allTerms, allMedia, allComments, allContentTerms] = await Promise.all([
      this.db.query.content.findMany(),
      this.db.query.terms.findMany(),
      this.db.query.media.findMany(),
      this.db.query.comments.findMany({ orderBy: (t, { asc }) => [asc(t.createdAt)] }),
      this.db.query.contentTerms.findMany()
    ]);

    const contentById = new Map(allContent.map((c) => [c.id, c]));
    const termById = new Map(allTerms.map((t) => [t.id, t]));
    const mediaById = new Map(allMedia.map((m) => [m.id, m]));

    const termsByContentId = new Map<string, string[]>();
    for (const ct of allContentTerms) {
      const list = termsByContentId.get(ct.contentId) ?? [];
      list.push(ct.termId);
      termsByContentId.set(ct.contentId, list);
    }

    const commentIndexById = new Map(allComments.map((c, i) => [c.id, i]));

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      media: allMedia.map((m) => ({
        fileName: m.fileName,
        originalFileName: m.originalFileName,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
        path: m.path,
        width: m.width,
        height: m.height,
        altText: m.altText,
        caption: m.caption,
        title: m.title
      })),
      terms: allTerms.map((t) => ({
        taxonomy: t.taxonomy,
        slug: t.slug,
        name: t.name,
        description: t.description,
        parentSlug: t.parentId ? termById.get(t.parentId)?.slug ?? null : null
      })),
      content: allContent.map((c) => ({
        type: c.type,
        slug: c.slug,
        title: c.title,
        excerpt: c.excerpt,
        content: c.content,
        status: c.status,
        featuredMediaFileName: c.featuredMediaId ? mediaById.get(c.featuredMediaId)?.fileName ?? null : null,
        parentSlug: c.parentId ? contentById.get(c.parentId)?.slug ?? null : null,
        menuOrder: c.menuOrder,
        publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
        terms: (termsByContentId.get(c.id) ?? [])
          .map((termId) => termById.get(termId))
          .filter((t): t is NonNullable<typeof t> => Boolean(t))
          .map((t) => ({ taxonomy: t.taxonomy, slug: t.slug }))
      })),
      comments: allComments.map((c) => {
        const contentRow = contentById.get(c.contentId);
        return {
          contentType: contentRow?.type ?? "",
          contentSlug: contentRow?.slug ?? "",
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          body: c.body,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
          parentIndex: c.parentId ? commentIndexById.get(c.parentId) ?? null : null
        };
      })
    };
  }
}
