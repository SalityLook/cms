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

  async set(contentId: string, key: string, value: unknown): Promise<void> {
    const existing = await this.db.query.contentMeta.findFirst({
      where: and(eq(contentMeta.contentId, contentId), eq(contentMeta.key, key))
    });
    if (existing) {
      await this.db.update(contentMeta).set({ value }).where(eq(contentMeta.id, existing.id));
    } else {
      await this.db.insert(contentMeta).values({ contentId, key, value });
    }
  }
}
