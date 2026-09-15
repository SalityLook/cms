import { pluginService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ enabled: z.boolean() });

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_plugins");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { enabled } = await readValidatedBody(event, bodySchema.parse);
  return pluginService.setEnabled(id, enabled);
});
