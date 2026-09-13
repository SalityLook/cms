import { contentSeoInputSchema } from "@selftaught/core";
import { seoService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const body = await readValidatedBody(event, contentSeoInputSchema.parse);
  await seoService.upsert(id, body);
  return seoService.getForContent(id);
});
