import { diffWords } from "diff";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { revisions } from "../../db/schema/revisions";
import { extractPlainText, type ContentDocument } from "../../shared/content-doc";

export interface SnapshotInput {
  contentId: string;
  authorId: string;
  title: string;
  excerpt?: string | null;
  content: ContentDocument;
}

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export class RevisionService {
  constructor(private readonly db: Database) {}

  async snapshot(input: SnapshotInput) {
    const [row] = await this.db
      .insert(revisions)
      .values({
        contentId: input.contentId,
        authorId: input.authorId,
        title: input.title,
        excerpt: input.excerpt ?? undefined,
        content: input.content,
        revisionType: "revision"
      })
      .returning();

    if (!row) {
      throw new Error("Failed to snapshot revision");
    }
    return row;
  }

  /**
   * Keeps exactly ONE autosave row per content (delete-then-insert, not a
   * partial unique index) -- realistically only one editor is active on a
   * given post at a time, so this is simpler than it would need to be for
   * true concurrent-editor support.
   */
  async upsertAutosave(input: SnapshotInput) {
    await this.db
      .delete(revisions)
      .where(and(eq(revisions.contentId, input.contentId), eq(revisions.revisionType, "autosave")));

    const [row] = await this.db
      .insert(revisions)
      .values({
        contentId: input.contentId,
        authorId: input.authorId,
        title: input.title,
        excerpt: input.excerpt ?? undefined,
        content: input.content,
        revisionType: "autosave"
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save autosave");
    }
    return row;
  }

  getAutosave(contentId: string) {
    return this.db.query.revisions.findFirst({
      where: and(eq(revisions.contentId, contentId), eq(revisions.revisionType, "autosave"))
    });
  }

  listForContent(contentId: string) {
    return this.db.query.revisions.findMany({
      where: eq(revisions.contentId, contentId),
      orderBy: [desc(revisions.createdAt)]
    });
  }

  getById(id: string) {
    return this.db.query.revisions.findFirst({ where: eq(revisions.id, id) });
  }

  /** Word-level diff of plain text (extractPlainText(), Phase 15) between two documents -- runs server-side so `diff` never reaches the client bundle. */
  diffDocuments(from: ContentDocument, to: ContentDocument): DiffPart[] {
    return diffWords(extractPlainText(from), extractPlainText(to));
  }
}
