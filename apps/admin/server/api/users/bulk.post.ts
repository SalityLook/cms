import { userService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["activate", "suspend"])
});

// No bulk "delete" — users are never hard-deleted (content.authorId is a
// NOT NULL FK to users.id), only suspended. See UserService for why.
export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_users");
  const { ids, action } = await readValidatedBody(event, bodySchema.parse);

  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];
  const status = action === "activate" ? "active" : "suspended";

  for (const id of ids) {
    try {
      const user = await userService.setStatus(id, status);
      if (!user) throw new Error("User not found");
      succeeded.push(id);
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return { succeeded, failed };
});
