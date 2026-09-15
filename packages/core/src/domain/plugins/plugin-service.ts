import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { installedPlugins } from "../../db/schema/plugins";
import { NotFoundError } from "../../errors";

export class PluginService {
  constructor(private readonly db: Database) {}

  /** Upsert-without-clobbering: if the plugin is already known, its `enabled` toggle (set by an admin) is left alone. */
  async ensureRegistered(key: string): Promise<void> {
    await this.db.insert(installedPlugins).values({ key }).onConflictDoNothing();
  }

  isEnabled(key: string) {
    return this.db.query.installedPlugins
      .findFirst({ where: eq(installedPlugins.key, key), columns: { enabled: true } })
      .then((row) => row?.enabled ?? true);
  }

  list() {
    return this.db.query.installedPlugins.findMany({ orderBy: (t, { asc }) => [asc(t.key)] });
  }

  async setEnabled(id: string, enabled: boolean) {
    const [row] = await this.db
      .update(installedPlugins)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(installedPlugins.id, id))
      .returning();
    if (!row) {
      throw new NotFoundError("Plugin not found");
    }
    return row;
  }
}
