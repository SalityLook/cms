import { contentDocumentSchema } from "@selftaught/core";
import { contentService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: contentDocumentSchema
});

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const body = await readValidatedBody(event, bodySchema.parse);
  return contentService.create(actor, { type: "post", ...body });
});
