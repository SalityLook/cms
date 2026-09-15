import { importService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ xml: z.string().min(1) });

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "manage_import_export");
  const { xml } = await readValidatedBody(event, bodySchema.parse);
  return importService.importWxr(actor, xml);
});
