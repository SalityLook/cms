import { settingsService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.record(z.string(), z.unknown());

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_settings");
  const body = await readValidatedBody(event, bodySchema.parse);

  await Promise.all(Object.entries(body).map(([key, value]) => settingsService.set(key, value)));
  return settingsService.getAll();
});
