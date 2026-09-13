import { taxonomyService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().optional()
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_categories");
  const taxonomy = getRouterParam(event, "taxonomy");
  if (!taxonomy) {
    throw createError({ statusCode: 400, statusMessage: "Missing taxonomy" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);
  return taxonomyService.createTerm({ taxonomy, ...body });
});
