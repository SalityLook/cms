import { apiKeyService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ label: z.string().trim().min(1).max(255) });

// Scopes are stored for forward compatibility but not yet enforced
// anywhere -- v1's actual surface (read published content, post comments
// as the key's owner) is the same regardless of scopes right now. Kept as
// a real column rather than hardcoding "read,comments:write" inline so a
// future phase narrowing the API surface doesn't need a migration.
const DEFAULT_SCOPES = ["read", "comments:write"];

export default defineEventHandler(async (event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const { label } = await readValidatedBody(event, bodySchema.parse);
  const { id, rawKey } = await apiKeyService.create({ userId: actor.id, label, scopes: DEFAULT_SCOPES });
  return { id, rawKey };
});
