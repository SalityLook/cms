import { mediaService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["delete"])
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_media");
  const { ids } = await readValidatedBody(event, bodySchema.parse);

  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of ids) {
    try {
      await mediaService.delete(id);
      succeeded.push(id);
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return { succeeded, failed };
});
