import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { revisions } from "../../db/schema/revisions";
import type { ContentDocument } from "../../shared/content-doc";

export interface SnapshotInput {
  contentId: string;
  authorId: string;
  title: string;
  excerpt?: string | null;
  content: ContentDocument;
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

  listForContent(contentId: string) {
    return this.db.query.revisions.findMany({
      where: eq(revisions.contentId, contentId),
      orderBy: [desc(revisions.createdAt)]
    });
  }

  getById(id: string) {
    return this.db.query.revisions.findFirst({ where: eq(revisions.id, id) });
  }
}
