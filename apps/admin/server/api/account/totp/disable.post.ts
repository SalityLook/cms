import { totpService, userService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({ password: z.string().min(1) });

export default defineApiHandler(async (event) => {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const { password } = await readValidatedBody(event, bodySchema.parse);
  // Re-entry required -- disabling 2FA is sensitive enough that an
  // already-open session shouldn't be sufficient on its own (e.g. a
  // momentarily unattended browser).
  const verified = await userService.verifyCredentials(actor.email, password);
  if (!verified) {
    throw createError({ statusCode: 401, statusMessage: "Incorrect password" });
  }

  await totpService.disable(actor.id);
  return { ok: true };
});
