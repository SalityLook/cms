import { and, asc, count as countRows, desc, eq, ilike, or } from "drizzle-orm";
import type { Database } from "../../db/client";
import { comments } from "../../db/schema/comments";
import { content } from "../../db/schema/content";
import { NotFoundError, ValidationError } from "../../errors";
import { hooks } from "../../hooks/hook-bus";

type CommentRow = typeof comments.$inferSelect;
export type CommentStatus = CommentRow["status"];

export interface CreateCommentInput {
  contentId: string;
  parentId?: string | null;
  authorName: string;
  authorEmail: string;
  authorUserId?: string | null;
  body: string;
  authorIp?: string;
  userAgent?: string;
}

export interface ListCommentFilters {
  contentId?: string;
  status?: CommentStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export class CommentService {
  constructor(private readonly db: Database) {}

  /**
   * Public submission path. The target content MUST already be published --
   * commenting on a draft/trashed/scheduled post must be impossible even if
   * someone guesses/enumerates a content id, so this checks status directly
   * rather than trusting the caller to have filtered already.
   */
  async create(input: CreateCommentInput): Promise<CommentRow> {
    const target = await this.db.query.content.findFirst({ where: eq(content.id, input.contentId) });
    if (!target || target.status !== "published") {
      throw new NotFoundError("Content not found");
    }

    if (input.parentId) {
      const parent = await this.db.query.comments.findFirst({ where: eq(comments.id, input.parentId) });
      if (!parent || parent.contentId !== input.contentId) {
        throw new ValidationError("Invalid parent comment");
      }
    }

    const [row] = await this.db.insert(comments).values({ ...input, status: "pending" }).returning();
    if (!row) {
      throw new Error("Failed to create comment");
    }
    await hooks.emitAction("comment:created", { commentId: row.id, contentId: row.contentId });
    return row;
  }

  /** Public read path -- approved only, regardless of what status filter callers might otherwise expect. */
  listForContent(contentId: string) {
    return this.db.query.comments.findMany({
      where: and(eq(comments.contentId, contentId), eq(comments.status, "approved")),
      orderBy: [asc(comments.createdAt)]
    });
  }

  /** Admin listing -- all statuses unless filtered, search on author name/email/body. */
  list(filters: ListCommentFilters = {}) {
    return this.db.query.comments.findMany({
      where: this.buildConditions(filters),
      orderBy: [desc(comments.createdAt)],
      limit: filters.limit,
      offset: filters.offset
    });
  }

  async count(filters: Pick<ListCommentFilters, "contentId" | "status" | "search"> = {}): Promise<number> {
    const [row] = await this.db.select({ value: countRows() }).from(comments).where(this.buildConditions(filters));
    return row?.value ?? 0;
  }

  async countPending(): Promise<number> {
    return this.count({ status: "pending" });
  }

  private buildConditions(filters: Pick<ListCommentFilters, "contentId" | "status" | "search">) {
    const conditions = [];
    if (filters.contentId) conditions.push(eq(comments.contentId, filters.contentId));
    if (filters.status) conditions.push(eq(comments.status, filters.status));
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(or(ilike(comments.authorName, pattern), ilike(comments.authorEmail, pattern), ilike(comments.body, pattern)));
    }
    return conditions.length ? and(...conditions) : undefined;
  }

  async updateStatus(id: string, status: CommentStatus): Promise<CommentRow> {
    const [row] = await this.db.update(comments).set({ status, updatedAt: new Date() }).where(eq(comments.id, id)).returning();
    if (!row) {
      throw new NotFoundError("Comment not found");
    }
    return row;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.query.comments.findFirst({ where: eq(comments.id, id) });
    if (!existing) {
      throw new NotFoundError("Comment not found");
    }
    await this.db.delete(comments).where(eq(comments.id, id));
  }
}
