import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageAdapter } from "./storage-adapter";

/**
 * Default v1 storage backend for self-hosted deployments. Swapping in an
 * S3-compatible backend later means implementing StorageAdapter again — no
 * changes needed in MediaService.
 */
export class LocalDiskStorage implements StorageAdapter {
  constructor(
    private readonly rootDir: string,
    private readonly publicPath: string = "/media"
  ) {}

  async put(key: string, data: Buffer): Promise<void> {
    const filePath = join(this.rootDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  getUrl(key: string): string {
    return `${this.publicPath}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await unlink(join(this.rootDir, key)).catch(() => undefined);
  }
}
