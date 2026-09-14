import { loginSchema } from "@selftaught/core";
import { userService } from "@selftaught/core/server";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_EMAIL = 5;

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse);

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const email = body.email.toLowerCase();

  // Two dimensions on purpose: IP limit catches one attacker spraying many
  // accounts; email limit catches many attackers/IPs targeting one account.
  if (!checkRateLimit(`login:ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many login attempts. Try again later." });
  }
  if (!checkRateLimit(`login:email:${email}`, MAX_ATTEMPTS_PER_EMAIL, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many login attempts for this account. Try again later." });
  }

  const user = await userService.verifyCredentials(email, body.password);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }
  });

  return { id: user.id, email: user.email, displayName: user.displayName };
});
