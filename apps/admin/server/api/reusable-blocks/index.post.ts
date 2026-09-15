import { contentDocumentSchema } from "@selftaught/core";
import { reusableBlockService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: contentDocumentSchema
});

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const body = await readValidatedBody(event, bodySchema.parse);
  return reusableBlockService.create({ ...body, createdBy: actor.id });
});
