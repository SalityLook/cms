import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import type { Database } from "../../db/client";
import { media } from "../../db/schema/media";
import type { StorageAdapter } from "./storage-adapter";

export interface UploadMediaInput {
  fileName: string;
  mimeType: string;
  data: Buffer;
  uploadedById: string;
  altText?: string;
}

export class MediaService {
  constructor(
    private readonly db: Database,
    private readonly storage: StorageAdapter
  ) {}

  async upload(input: UploadMediaInput) {
    const extension = input.fileName.includes(".") ? input.fileName.split(".").pop() : undefined;
    const key = extension ? `${randomUUID()}.${extension}` : randomUUID();

    let width: number | undefined;
    let height: number | undefined;
    if (input.mimeType.startsWith("image/")) {
      try {
        const meta = await sharp(input.data).metadata();
        width = meta.width;
        height = meta.height;
      } catch {
        // Not a decodable raster image (e.g. some SVGs) — dimensions stay unset.
      }
    }

    await this.storage.put(key, input.data, input.mimeType);

    const [row] = await this.db
      .insert(media)
      .values({
        fileName: key,
        originalFileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.data.byteLength,
        path: key,
        width,
        height,
        altText: input.altText,
        uploadedById: input.uploadedById
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save media record");
    }
    return { ...row, url: this.storage.getUrl(key) };
  }

  async list() {
    const rows = await this.db.query.media.findMany({ orderBy: (row, { desc }) => [desc(row.createdAt)] });
    return rows.map((row) => ({ ...row, url: this.storage.getUrl(row.path) }));
  }

  getById(id: string) {
    return this.db.query.media.findFirst({ where: eq(media.id, id) });
  }

  async getByIdWithUrl(id: string) {
    const row = await this.getById(id);
    return row ? { ...row, url: this.storage.getUrl(row.path) } : null;
  }

  async delete(id: string) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Media not found");
    }
    await this.storage.delete(existing.path);
    await this.db.delete(media).where(eq(media.id, id));
  }

  url(row: { path: string }): string {
    return this.storage.getUrl(row.path);
  }
}
