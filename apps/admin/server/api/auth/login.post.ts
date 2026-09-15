import { loginSchema } from "@selftaught/core";
import { permissionService, userService } from "@selftaught/core/server";

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

  // Zero-capability accounts (self-registered subscribers, Phase 19) can log
  // into the public site but never here -- rejected at the login boundary
  // rather than letting them authenticate then 403 on every action.
  const actor = await permissionService.loadActor(user.id);
  if (!actor || actor.capabilities.length === 0) {
    throw createError({ statusCode: 403, statusMessage: "This account does not have admin access." });
  }

  // TOTP-enabled accounts don't get a real session yet -- a short-lived
  // challenge token stands in until POST /api/auth/totp/verify confirms a
  // real code (or recovery code). The capability check above still applies
  // first: a zero-capability account is rejected outright regardless of
  // whether it even has TOTP configured.
  if (user.totpEnabled) {
    const challengeToken = createTotpChallenge(user.id);
    return { requiresTotp: true, challengeToken };
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
