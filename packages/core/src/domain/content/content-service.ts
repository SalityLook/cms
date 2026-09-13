import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { content } from "../../db/schema/content";
import type { CapabilityKey } from "../../registry/capabilities";
import { type ContentTypeDefinition, contentTypeRegistry } from "../../registry/content-types";
import type { ContentDocument } from "../../shared/content-doc";
import type { Actor } from "../../shared/types";

type ContentRow = typeof content.$inferSelect;

export interface CreateContentInput {
  type: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: ContentDocument;
}

export interface UpdateContentInput {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: ContentDocument;
  featuredMediaId?: string | null;
}

export interface ListContentFilters {
  type?: string;
  status?: ContentRow["status"];
}

export class ContentService {
  constructor(private readonly db: Database) {}

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
        authorId: actor.id,
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

    const [row] = await this.db
      .update(content)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to update content");
    }
    return row;
  }

  async publish(actor: Actor, id: string): Promise<ContentRow> {
    const existing = await this.requireExisting(id);
    const definition = this.requireContentType(existing.type);
    this.assertCan(actor, definition.capabilityMap.publish);

    const [row] = await this.db
      .update(content)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to publish content");
    }
    return row;
  }

  async unpublish(actor: Actor, id: string): Promise<ContentRow> {
    const existing = await this.requireExisting(id);
    const definition = this.requireContentType(existing.type);
    this.assertOwnershipOrCapability(actor, existing, definition);

    const [row] = await this.db
      .update(content)
      .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to unpublish content");
    }
    return row;
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

  list(filters: ListContentFilters = {}) {
    const conditions = [];
    if (filters.type) conditions.push(eq(content.type, filters.type));
    if (filters.status) conditions.push(eq(content.status, filters.status));

    return this.db.query.content.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(content.updatedAt)]
    });
  }

  private requireContentType(typeKey: string): ContentTypeDefinition {
    const definition = contentTypeRegistry.get(typeKey);
    if (!definition) {
      throw new Error(`Unknown content type: ${typeKey}`);
    }
    return definition;
  }

  private async requireExisting(id: string): Promise<ContentRow> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Content not found");
    }
    return existing;
  }

  private assertCan(actor: Actor, capability: CapabilityKey) {
    if (!actor.capabilities.includes(capability)) {
      throw new Error(`Actor lacks capability: ${capability}`);
    }
  }

  private assertOwnershipOrCapability(actor: Actor, existing: ContentRow, definition: ContentTypeDefinition) {
    const isOwner = existing.authorId === actor.id;
    this.assertCan(actor, isOwner ? definition.capabilityMap.edit : definition.capabilityMap.editOthers);
  }
}
