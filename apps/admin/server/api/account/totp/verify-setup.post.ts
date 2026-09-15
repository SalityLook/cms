import { totpService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ code: z.string().trim().min(6).max(6) });

export default defineApiHandler(async (event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const { code } = await readValidatedBody(event, bodySchema.parse);
  const recoveryCodes = await totpService.confirmSetup(actor.id, code);
  return { recoveryCodes };
});
