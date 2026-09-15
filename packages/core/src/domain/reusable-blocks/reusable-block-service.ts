import { count as countRows, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { reusableBlockUsages, reusableBlocks } from "../../db/schema/reusable-blocks";
import { NotFoundError, ValidationError } from "../../errors";
import type { BlockNode, ContentDocument } from "../../shared/content-doc";

export interface CreateReusableBlockInput {
  title: string;
  content: ContentDocument;
  createdBy: string;
}

export interface UpdateReusableBlockInput {
  title?: string;
  content?: ContentDocument;
}

export class ReusableBlockService {
  constructor(private readonly db: Database) {}

  list() {
    return this.db.query.reusableBlocks.findMany({ orderBy: (t, { asc }) => [asc(t.title)] });
  }

  getById(id: string) {
    return this.db.query.reusableBlocks.findFirst({ where: eq(reusableBlocks.id, id) });
  }

  async create(input: CreateReusableBlockInput) {
    const [row] = await this.db.insert(reusableBlocks).values(input).returning();
    if (!row) {
      throw new Error("Failed to create reusable block");
    }
    return row;
  }

  /** The "Edit sumber" write path -- writes directly here, NOT through a referencing post's own save, so the change is live everywhere immediately. */
  async update(id: string, input: UpdateReusableBlockInput) {
    const [row] = await this.db
      .update(reusableBlocks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(reusableBlocks.id, id))
      .returning();
    if (!row) {
      throw new NotFoundError("Reusable block not found");
    }
    return row;
  }

  async usageCount(id: string): Promise<number> {
    const [row] = await this.db
      .select({ value: countRows() })
      .from(reusableBlockUsages)
      .where(eq(reusableBlockUsages.reusableBlockId, id));
    return row?.value ?? 0;
  }

  /** Refuses to delete a block still referenced by any post/page -- a dangling reusableBlockRef would resolve to nothing at render time otherwise. */
  async delete(id: string): Promise<void> {
    const usages = await this.usageCount(id);
    if (usages > 0) {
      throw new ValidationError(`Cannot delete: still used in ${usages} post/page — remove the reference first`);
    }
    await this.db.delete(reusableBlocks).where(eq(reusableBlocks.id, id));
  }

  /**
   * Resolves every reusableBlockRef node in the tree by splicing in the
   * CURRENT content of the block it references, recursively (so a reusable
   * block can itself reference another). This is what makes a reference
   * "synced" rather than a detached copy: the substitution happens fresh at
   * every read, from the live reusable_blocks row, never from a value
   * cached inside the referencing post's own content json. A dangling
   * reference (block deleted) is skipped silently, same posture as
   * MenuService.resolveMenu() skipping a dangling content link. `visited`
   * guards against a reference cycle turning this into an infinite loop.
   */
  async resolveDocument(doc: ContentDocument): Promise<ContentDocument> {
    return { ...doc, content: await this.resolveNodes(doc.content, new Set()) };
  }

  private async resolveNodes(nodes: BlockNode[], visited: Set<string>): Promise<BlockNode[]> {
    const result: BlockNode[] = [];
    for (const node of nodes) {
      const refId = node.type === "reusableBlockRef" ? node.attrs?.reusableBlockId : undefined;
      if (typeof refId === "string") {
        if (visited.has(refId)) continue; // cycle guard
        const block = await this.getById(refId);
        if (block) {
          const nextVisited = new Set(visited).add(refId);
          result.push(...(await this.resolveNodes(block.content.content, nextVisited)));
        }
        continue;
      }
      result.push(node.content ? { ...node, content: await this.resolveNodes(node.content, visited) } : node);
    }
    return result;
  }
}
