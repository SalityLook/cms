import { contentDocumentSchema } from "@selftaught/core";
import { reusableBlockService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  content: contentDocumentSchema.optional()
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);
  return reusableBlockService.update(id, body);
});
