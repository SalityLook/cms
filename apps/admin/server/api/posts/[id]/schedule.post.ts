import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1))
});

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "publish_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { scheduledAt } = await readValidatedBody(event, bodySchema.parse);
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: "Invalid scheduledAt" });
  }

  return contentService.schedule(actor, id, date);
});
