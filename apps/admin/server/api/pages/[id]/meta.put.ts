import { contentMetaService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  key: z.string().min(1),
  value: z.unknown()
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_pages");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { key, value } = await readValidatedBody(event, bodySchema.parse);
  await contentMetaService.set(id, key, value);
  return { ok: true };
});
