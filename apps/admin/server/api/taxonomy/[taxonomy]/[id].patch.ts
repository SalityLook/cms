import { taxonomyService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional()
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_categories");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);
  return taxonomyService.updateTerm(id, body);
});
