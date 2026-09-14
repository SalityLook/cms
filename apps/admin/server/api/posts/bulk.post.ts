import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["trash", "untrash", "delete", "publish", "unpublish"])
});

/**
 * Loops the existing single-item ContentService methods rather than a new
 * bulk-specific code path, so capability/ownership checks stay centralized
 * there. Partial-failure tolerant by design: a bulk action by an `author`
 * against a mix of their own and others' posts should report some
 * successes and some per-item failures, not fail the whole request.
 */
export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const { ids, action } = await readValidatedBody(event, bodySchema.parse);

  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of ids) {
    try {
      switch (action) {
        case "trash":
          await contentService.trash(actor, id);
          break;
        case "untrash":
          await contentService.restoreFromTrash(actor, id);
          break;
        case "delete":
          await contentService.delete(actor, id);
          break;
        case "publish":
          await contentService.publish(actor, id);
          break;
        case "unpublish":
          await contentService.unpublish(actor, id);
          break;
      }
      succeeded.push(id);
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return { succeeded, failed };
});
