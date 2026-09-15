import { and, count as countRows, desc, eq, ilike, lte, or } from "drizzle-orm";
import type { Database } from "../../db/client";
import { content } from "../../db/schema/content";
import type { RevisionService } from "../../domain/revisions/revision-service";
import { CapabilityError, NotFoundError, TransitionError, ValidationError } from "../../errors";
import { hooks } from "../../hooks/hook-bus";
import type { CapabilityKey } from "../../registry/capabilities";
import { type ContentTypeDefinition, contentTypeRegistry } from "../../registry/content-types";
import { extractPlainText, type ContentDocument } from "../../shared/content-doc";
import type { Actor } from "../../shared/types";

type ContentRow = typeof content.$inferSelect;
export type ContentStatus = ContentRow["status"];

export interface CreateContentInput {
  type: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: ContentDocument;
  parentId?: string | null;
  menuOrder?: number;
}

export interface UpdateContentInput {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: ContentDocument;
  featuredMediaId?: string | null;
  parentId?: string | null;
  menuOrder?: number;
}

export interface ListContentFilters {
  type?: string;
  status?: ContentStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Which statuses a piece of content may transition to from its current status.
 * Enforced in transitionStatus() so no caller (API route, task, future plugin)
 * can skip the workflow by calling the DB directly through this service.
 */
const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ["pending", "scheduled", "published", "trashed"],
  pending: ["draft", "scheduled", "published", "trashed"],
  scheduled: ["draft", "published", "trashed"],
  published: ["draft", "trashed"],
  trashed: ["draft"]
};

export class ContentService {
  constructor(
    private readonly db: Database,
    private readonly revisions: RevisionService
  ) {}

  async create(actor: Actor, input: CreateContentInput): Promise<ContentRow> {
    const definition = this.requireContentType(input.type);
    this.assertCan(actor, definition.capabilityMap.edit);

    const [row] = await this.db
      .insert(content)
      .values({
        type: input.type,
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        contentText: extractPlainText(input.content),
        authorId: actor.id,
        parentId: input.parentId,
        menuOrder: input.menuOrder,
        status: "draft"
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create content");
    }
    return row;
  }

  async update(actor: Actor, id: string, input: UpdateContentInput): Promise<ContentRow> {
    const existing = await this.requireExisting(id);
    const definition = this.requireContentType(existing.type);
    this.assertOwnershipOrCapability(actor, existing, definition);

    await this.snapshotCurrent(actor, existing);
    await hooks.emitAction("content:beforeSave", {
      contentId: existing.id,
      type: existing.type,
      title: input.title ?? existing.title
    });

    const [row] = await this.db
      .update(content)
      .set({
        ...input,
        contentText: input.content ? extractPlainText(input.content) : undefined,
        updatedAt: new Date()
      })
      .where(eq(content.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to update content");
    }
    return row;
  }

  async transitionStatus(
    actor: Actor,
    id: string,
    next: ContentStatus,
    opts?: { scheduledAt?: Date }
  ): Promise<ContentRow> {
    const existing = await this.requireExisting(id);
    const definition = this.requireContentType(existing.type);

    if (!ALLOWED_TRANSITIONS[existing.status].includes(next)) {
      throw new TransitionError(`Cannot transition content from ${existing.status} to ${next}`);
    }

    if (next === "published" || next === "scheduled") {
      this.assertCan(actor, definition.capabilityMap.publish);
    } else {
      this.assertOwnershipOrCapability(actor, existing, definition);
    }

    const [row] = await this.db
      .update(content)
      .set({
        status: next,
        publishedAt: next === "published" ? new Date() : existing.publishedAt,
        scheduledAt: next === "scheduled" ? (opts?.scheduledAt ?? null) : null,
        updatedAt: new Date()
      })
      .where(eq(content.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to transition content status");
    }

    await hooks.emitAction("content:statusChanged", {
      contentId: row.id,
      type: row.type,
      from: existing.status,
      to: next
    });
    if (next === "published") {
      await hooks.emitAction("content:published", {
        content: { id: row.id, type: row.type, slug: row.slug, title: row.title }
      });
    }

    return row;
  }

  publish(actor: Actor, id: string) {
    return this.transitionStatus(actor, id, "published");
  }

  unpublish(actor: Actor, id: string) {
    return this.transitionStatus(actor, id, "draft");
  }

  submitForReview(actor: Actor, id: string) {
    return this.transitionStatus(actor, id, "pending");
  }

  schedule(actor: Actor, id: string, scheduledAt: Date) {
    return this.transitionStatus(actor, id, "scheduled", { scheduledAt });
  }

  trash(actor: Actor, id: string) {
    return this.transitionStatus(actor, id, "trashed");
  }

  restoreFromTrash(actor: Actor, id: string) {
    return this.transitionStatus(actor, id, "draft");
  }

  /** Called by the Nitro scheduled task — a system action, not tied to any user's capabilities. */
  async publishDueScheduled(): Promise<ContentRow[]> {
    const due = await this.db.query.content.findMany({
      where: and(eq(content.status, "scheduled"), lte(content.scheduledAt, new Date()))
    });

    const published: ContentRow[] = [];
    for (const item of due) {
      const [row] = await this.db
        .update(content)
        .set({ status: "published", publishedAt: new Date(), scheduledAt: null, updatedAt: new Date() })
        .where(eq(content.id, item.id))
        .returning();
      if (row) {
        published.push(row);
        await hooks.emitAction("content:published", {
          content: { id: row.id, type: row.type, slug: row.slug, title: row.title }
        });
      }
    }
    return published;
  }

  async restoreRevision(actor: Actor, id: string, revisionId: string): Promise<ContentRow> {
    const existing = await this.requireExisting(id);
    const definition = this.requireContentType(existing.type);
    this.assertOwnershipOrCapability(actor, existing, definition);

    const revision = await this.revisions.getById(revisionId);
    if (!revision || revision.contentId !== id) {
      throw new NotFoundError("Revision not found");
    }

    await this.snapshotCurrent(actor, existing);

    const [row] = await this.db
      .update(content)
      .set({
        title: revision.title,
        excerpt: revision.excerpt,
        content: revision.content,
        contentText: extractPlainText(revision.content),
        updatedAt: new Date()
      })
      .where(eq(content.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to restore revision");
    }
    return row;
  }

  listRevisions(id: string) {
    return this.revisions.listForContent(id);
  }

  async delete(actor: Actor, id: string): Promise<void> {
    const existing = await this.requireExisting(id);
    const definition = this.requireContentType(existing.type);
    this.assertCan(actor, definition.capabilityMap.delete);
    await this.db.delete(content).where(eq(content.id, id));
  }

  getById(id: string) {
    return this.db.query.content.findFirst({ where: eq(content.id, id) });
  }

  getBySlug(type: string, slug: string) {
    return this.db.query.content.findFirst({ where: and(eq(content.type, type), eq(content.slug, slug)) });
  }

  private searchCondition(search?: string) {
    if (!search) return undefined;
    const pattern = `%${search}%`;
    return or(ilike(content.title, pattern), ilike(content.slug, pattern));
  }

  list(filters: ListContentFilters = {}) {
    const conditions = [];
    if (filters.type) conditions.push(eq(content.type, filters.type));
    if (filters.status) conditions.push(eq(content.status, filters.status));
    const search = this.searchCondition(filters.search);
    if (search) conditions.push(search);

    return this.db.query.content.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(content.updatedAt)],
      limit: filters.limit,
      offset: filters.offset
    });
  }

  async count(filters: Pick<ListContentFilters, "type" | "status" | "search"> = {}): Promise<number> {
    const conditions = [];
    if (filters.type) conditions.push(eq(content.type, filters.type));
    if (filters.status) conditions.push(eq(content.status, filters.status));
    const search = this.searchCondition(filters.search);
    if (search) conditions.push(search);

    const [row] = await this.db
      .select({ value: countRows() })
      .from(content)
      .where(conditions.length ? and(...conditions) : undefined);
    return row?.value ?? 0;
  }

  private snapshotCurrent(actor: Actor, existing: ContentRow) {
    return this.revisions.snapshot({
      contentId: existing.id,
      authorId: actor.id,
      title: existing.title,
      excerpt: existing.excerpt,
      content: existing.content
    });
  }

  private requireContentType(typeKey: string): ContentTypeDefinition {
    const definition = contentTypeRegistry.get(typeKey);
    if (!definition) {
      throw new ValidationError(`Unknown content type: ${typeKey}`);
    }
    return definition;
  }

  private async requireExisting(id: string): Promise<ContentRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError("Content not found");
    }
    return existing;
  }

  private assertCan(actor: Actor, capability: CapabilityKey) {
    if (!actor.capabilities.includes(capability)) {
      throw new CapabilityError(`Actor lacks capability: ${capability}`);
    }
  }

  private assertOwnershipOrCapability(actor: Actor, existing: ContentRow, definition: ContentTypeDefinition) {
    const isOwner = existing.authorId === actor.id;
    this.assertCan(actor, isOwner ? definition.capabilityMap.edit : definition.capabilityMap.editOthers);
  }
}
