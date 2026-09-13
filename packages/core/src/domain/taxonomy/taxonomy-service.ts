import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { contentTerms, terms } from "../../db/schema/taxonomy";

export interface CreateTermInput {
  taxonomy: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
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

  getTermBySlug(taxonomy: string, slug: string) {
    return this.db.query.terms.findFirst({ where: and(eq(terms.taxonomy, taxonomy), eq(terms.slug, slug)) });
  }

  async deleteTerm(id: string) {
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
