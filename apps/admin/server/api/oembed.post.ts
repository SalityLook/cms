import { oembedService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ url: z.string().url() });

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const { url } = await readValidatedBody(event, bodySchema.parse);
  return oembedService.resolve(url);
});
