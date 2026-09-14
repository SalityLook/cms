import { contentDocumentSchema } from "@selftaught/core";
import { contentService, taxonomyService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  content: contentDocumentSchema.optional(),
  featuredMediaId: z.string().uuid().nullable().optional(),
  termIds: z.array(z.string().uuid()).optional()
});

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { termIds, ...contentInput } = await readValidatedBody(event, bodySchema.parse);

  const updated = await contentService.update(actor, id, contentInput);
  if (termIds) {
    await taxonomyService.assignTerms(id, termIds);
  }
  return updated;
});
