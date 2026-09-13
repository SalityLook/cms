import { contentDocumentSchema } from "@selftaught/core";
import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  content: contentDocumentSchema.optional()
});

export default defineEventHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);
  return contentService.update(actor, id, body);
});
