import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { contentTerms, terms } from "../../db/schema/taxonomy";
import { ValidationError } from "../../errors";

export interface CreateTermInput {
  taxonomy: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface UpdateTermInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
}

type TermRow = {
  id: string;
  taxonomy: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
};

export interface TermTreeNode extends TermRow {
  children: TermTreeNode[];
}

export class TaxonomyService {
  constructor(private readonly db: Database) {}

  async createTerm(input: CreateTermInput) {
    const [row] = await this.db.insert(terms).values(input).returning();
    if (!row) {
      throw new Error("Failed to create term");
    }
    return row;
  }

  listByTaxonomy(taxonomy: string) {
    return this.db.query.terms.findMany({
      where: eq(terms.taxonomy, taxonomy),
      orderBy: [asc(terms.name)]
    });
  }

  /**
   * Flat list built into a parent->children tree client-side. Taxonomy
   * sizes here are small (a school's category list, not millions of rows),
   * so a recursive CTE would be over-engineering for the actual scale.
   */
  async listTree(taxonomy: string): Promise<TermTreeNode[]> {
    const flat = await this.listByTaxonomy(taxonomy);
    const byId = new Map<string, TermTreeNode>(flat.map((term) => [term.id, { ...term, children: [] }]));
    const roots: TermTreeNode[] = [];

    for (const term of byId.values()) {
      if (term.parentId && byId.has(term.parentId)) {
        byId.get(term.parentId)!.children.push(term);
      } else {
        roots.push(term);
      }
    }
    return roots;
  }

  getTermBySlug(taxonomy: string, slug: string) {
    return this.db.query.terms.findFirst({ where: and(eq(terms.taxonomy, taxonomy), eq(terms.slug, slug)) });
  }

  getById(id: string) {
    return this.db.query.terms.findFirst({ where: eq(terms.id, id) });
  }

  /** Root-first ancestor chain (excludes the term itself) -- for public breadcrumbs. */
  async getAncestors(id: string): Promise<TermRow[]> {
    const chain: TermRow[] = [];
    let current = await this.getById(id);
    while (current?.parentId) {
      const parent = await this.getById(current.parentId);
      if (!parent) break;
      chain.unshift(parent);
      current = parent;
    }
    return chain;
  }

  /** Direct children only (one level) -- for public category listing pages. */
  listChildren(parentId: string) {
    return this.db.query.terms.findMany({ where: eq(terms.parentId, parentId), orderBy: [asc(terms.name)] });
  }

  async updateTerm(id: string, input: UpdateTermInput) {
    if (input.parentId) {
      if (input.parentId === id) {
        throw new ValidationError("A category cannot be its own parent");
      }
      if (await this.wouldCreateCycle(id, input.parentId)) {
        throw new ValidationError("Cannot set parent: would create a category loop");
      }
    }

    const [row] = await this.db.update(terms).set(input).where(eq(terms.id, id)).returning();
    if (!row) {
      throw new ValidationError("Term not found");
    }
    return row;
  }

  /** Walks the ancestor chain of `newParentId` looking for `termId` -- the FK alone doesn't stop an A->B->A loop. */
  private async wouldCreateCycle(termId: string, newParentId: string): Promise<boolean> {
    let currentId: string | null = newParentId;
    const seen = new Set<string>();

    while (currentId) {
      if (currentId === termId) return true;
      if (seen.has(currentId)) return false; // already-broken chain elsewhere; not this call's problem
      seen.add(currentId);

      const current: { parentId: string | null } | undefined = await this.db.query.terms.findFirst({
        where: eq(terms.id, currentId),
        columns: { parentId: true }
      });
      currentId = current?.parentId ?? null;
    }
    return false;
  }

  async deleteTerm(id: string) {
    const children = await this.db.query.terms.findMany({ where: eq(terms.parentId, id), columns: { id: true } });
    if (children.length > 0) {
      throw new ValidationError("Cannot delete a category that still has subcategories — move or delete them first");
    }
    await this.db.delete(terms).where(eq(terms.id, id));
  }

  async assignTerms(contentId: string, termIds: string[]) {
    await this.db.delete(contentTerms).where(eq(contentTerms.contentId, contentId));
    if (termIds.length === 0) {
      return;
    }
    await this.db.insert(contentTerms).values(termIds.map((termId) => ({ contentId, termId })));
  }

  termsForContent(contentId: string) {
    return this.db
      .select({ id: terms.id, taxonomy: terms.taxonomy, slug: terms.slug, name: terms.name })
      .from(contentTerms)
      .innerJoin(terms, eq(terms.id, contentTerms.termId))
      .where(eq(contentTerms.contentId, contentId));
  }

  async contentIdsForTerm(termId: string): Promise<string[]> {
    const rows = await this.db
      .select({ contentId: contentTerms.contentId })
      .from(contentTerms)
      .where(eq(contentTerms.termId, termId));
    return rows.map((row) => row.contentId);
  }
}
