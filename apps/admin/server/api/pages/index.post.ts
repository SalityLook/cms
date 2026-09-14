import { contentDocumentSchema } from "@selftaught/core";
import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: contentDocumentSchema,
  parentId: z.string().uuid().nullable().optional(),
  menuOrder: z.number().int().optional()
});

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_pages");
  const body = await readValidatedBody(event, bodySchema.parse);
  return contentService.create(actor, { type: "page", ...body });
});
