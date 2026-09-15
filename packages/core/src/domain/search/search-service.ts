import { sql } from "drizzle-orm";
import type { Database } from "../../db/client";

export interface SearchOptions {
  type?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResultRow {
  id: string;
  type: string;
  slug: string;
  title: string;
  snippet: string;
}

export interface SearchResults {
  results: SearchResultRow[];
  total: number;
}

/**
 * Full-text search over content.search_tsv (generated column, migration 0009) --
 * that column is intentionally NOT part of the Drizzle schema (it's write-never,
 * read-only via raw SQL here), so every query in this service goes through
 * db.execute(sql\`...\`) rather than the query builder. `query` is always bound
 * as a parameter (never string-concatenated) even though plainto_tsquery makes
 * injection via tsquery syntax unlikely -- defense in depth costs nothing here.
 */
export class SearchService {
  constructor(private readonly db: Database) {}

  async search(query: string, opts: SearchOptions = {}): Promise<SearchResults> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [], total: 0 };
    }

    const limit = opts.limit ?? 10;
    const offset = opts.offset ?? 0;
    const typeFilter = opts.type ? sql`and type = ${opts.type}` : sql``;

    const rows = await this.db.execute<Record<string, unknown>>(sql`
      select
        id, type, slug, title,
        ts_headline(
          'simple',
          replace(replace(replace(coalesce(excerpt, content_text, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
          plainto_tsquery('simple', ${trimmed}),
          'MaxFragments=1, MaxWords=30, MinWords=15'
        ) as snippet
      from content
      where status = 'published'
        and search_tsv @@ plainto_tsquery('simple', ${trimmed})
        ${typeFilter}
      order by ts_rank(search_tsv, plainto_tsquery('simple', ${trimmed})) desc
      limit ${limit} offset ${offset}
    `);

    const countResult = await this.db.execute<Record<string, unknown>>(sql`
      select count(*) as total
      from content
      where status = 'published'
        and search_tsv @@ plainto_tsquery('simple', ${trimmed})
        ${typeFilter}
    `);

    return {
      results: Array.from(rows) as unknown as SearchResultRow[],
      total: Number((Array.from(countResult)[0]?.total as string | number | undefined) ?? 0)
    };
  }
}
