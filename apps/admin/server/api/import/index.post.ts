import { importService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ bundle: z.record(z.string(), z.unknown()) });

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "manage_import_export");
  const { bundle } = await readValidatedBody(event, bodySchema.parse);
  return importService.importJson(actor, bundle as never);
});
