import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { contentMeta } from "../../db/schema/content";

export class ContentMetaService {
  constructor(private readonly db: Database) {}

  async get(contentId: string, key: string): Promise<unknown> {
    const row = await this.db.query.contentMeta.findFirst({
      where: and(eq(contentMeta.contentId, contentId), eq(contentMeta.key, key))
    });
    return row?.value ?? null;
  }

  async getAll(contentId: string): Promise<Record<string, unknown>> {
    const rows = await this.db.query.contentMeta.findMany({ where: eq(contentMeta.contentId, contentId) });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  /**
   * A real upsert (unique index on (content_id, key), migration 0006) --
   * this used to be find-then-update/insert, a genuine race condition
   * under concurrent writes to the same key. See CLAUDE.md Phase 12 notes.
   */
  async set(contentId: string, key: string, value: unknown): Promise<void> {
    await this.db
      .insert(contentMeta)
      .values({ contentId, key, value })
      .onConflictDoUpdate({ target: [contentMeta.contentId, contentMeta.key], set: { value } });
  }

  async delete(contentId: string, key: string): Promise<void> {
    await this.db.delete(contentMeta).where(and(eq(contentMeta.contentId, contentId), eq(contentMeta.key, key)));
  }
}
