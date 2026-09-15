import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../auth/password";
import type { Database } from "../../db/client";
import { apiKeys } from "../../db/schema/api-keys";
import { NotFoundError } from "../../errors";

export interface CreateApiKeyInput {
  userId: string;
  label: string;
  scopes: string[];
}

export interface ApiKeyVerifyResult {
  userId: string;
  scopes: string[];
  keyRowId: string;
}

export class ApiKeyService {
  constructor(private readonly db: Database) {}

  /** Returns the raw key ONCE -- only keyId + secretHash are ever persisted, same posture as TOTP recovery codes (Phase 22). */
  async create(input: CreateApiKeyInput): Promise<{ id: string; rawKey: string }> {
    const keyId = randomBytes(8).toString("hex");
    const secret = randomBytes(24).toString("hex");
    const secretHash = await hashPassword(secret);

    const [row] = await this.db
      .insert(apiKeys)
      .values({ userId: input.userId, label: input.label, keyId, secretHash, scopes: input.scopes })
      .returning();
    if (!row) {
      throw new Error("Failed to create API key");
    }

    return { id: row.id, rawKey: `stk_${keyId}.${secret}` };
  }

  listForUser(userId: string) {
    return this.db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      columns: { id: true, label: true, scopes: true, lastUsedAt: true, createdAt: true, revokedAt: true }
    });
  }

  async revoke(id: string, userId: string): Promise<void> {
    const [row] = await this.db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();
    if (!row) {
      throw new NotFoundError("API key not found");
    }
  }

  /** Parses "<keyId>.<secret>" (optionally prefixed "stk_"), looks up the ONE matching row by keyId, then argon2-verifies the secret -- never scans/verifies against every key in the table. */
  async verify(rawKey: string): Promise<ApiKeyVerifyResult | null> {
    const withoutPrefix = rawKey.startsWith("stk_") ? rawKey.slice(4) : rawKey;
    const [keyId, secret] = withoutPrefix.split(".");
    if (!keyId || !secret) return null;

    const row = await this.db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.keyId, keyId), isNull(apiKeys.revokedAt))
    });
    if (!row) return null;

    const valid = await verifyPassword(row.secretHash, secret);
    if (!valid) return null;

    await this.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));
    return { userId: row.userId, scopes: row.scopes, keyRowId: row.id };
  }
}
