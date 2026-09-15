import { importService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ bundle: z.record(z.string(), z.unknown()) });

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_import_export");
  const { bundle } = await readValidatedBody(event, bodySchema.parse);
  return importService.previewJson(bundle as never);
});
