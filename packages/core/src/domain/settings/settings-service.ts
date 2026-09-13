import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { settings } from "../../db/schema/settings";

export class SettingsService {
  constructor(private readonly db: Database) {}

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const row = await this.db.query.settings.findFirst({ where: eq(settings.key, key) });
    return row?.value as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.db.query.settings.findMany();
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }
}
