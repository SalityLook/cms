import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["trash", "untrash", "delete", "publish", "unpublish"])
});

/** Mirrors apps/admin/server/api/posts/bulk.post.ts — see its comment for rationale. */
export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_pages");
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
