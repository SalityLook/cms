import { roleService, settingsService, userService } from "@selftaught/core/server";
import { z } from "zod";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 5;

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(255)
});

export default defineEventHandler(async (event) => {
  const allowSelfRegistration = await settingsService.get<boolean>("allowSelfRegistration");
  if (!allowSelfRegistration) {
    throw createError({ statusCode: 403, statusMessage: "Self-registration is not enabled on this site." });
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  if (!checkRateLimit(`register:ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many registration attempts. Try again later." });
  }

  const body = await readValidatedBody(event, bodySchema.parse);

  const existing = await userService.findByEmail(body.email);
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Email already in use." });
  }

  const user = await userService.create(body);
  if (!user) {
    throw createError({ statusCode: 500, statusMessage: "Failed to register." });
  }

  const defaultRole = (await settingsService.get<string>("selfRegistrationDefaultRole")) || "subscriber";
  await roleService.setRolesForUser(user.id, [defaultRole]);

  await setUserSession(event, {
    user: { id: user.id, email: user.email, displayName: user.displayName, slug: user.slug }
  });

  return { id: user.id, email: user.email, displayName: user.displayName, slug: user.slug };
});
