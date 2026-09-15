import { commentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["approve", "spam", "trash", "delete"])
});

/** Mirrors apps/admin/server/api/posts/bulk.post.ts -- see its comment for rationale. */
export default defineApiHandler(async (event) => {
  requireCapability(event, "moderate_comments");
  const { ids, action } = await readValidatedBody(event, bodySchema.parse);

  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of ids) {
    try {
      if (action === "delete") {
        await commentService.delete(id);
      } else {
        const status = action === "approve" ? "approved" : action;
        await commentService.updateStatus(id, status);
      }
      succeeded.push(id);
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return { succeeded, failed };
});
