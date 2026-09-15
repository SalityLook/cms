import { userService, totpService } from "@selftaught/core/server";
import { z } from "zod";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_TOKEN = 8;

const bodySchema = z.object({
  challengeToken: z.string().uuid(),
  code: z.string().trim().min(4).max(64)
});

export default defineEventHandler(async (event) => {
  const { challengeToken, code } = await readValidatedBody(event, bodySchema.parse);

  // Rate-limited per challenge token (not per-IP/email -- this is a
  // distinct, stricter step deliberately separate from the login rate
  // limits) so brute-forcing a 6-digit code against one stolen/guessed
  // token is bounded regardless of how many IPs an attacker spreads across.
  if (!checkRateLimit(`totp:token:${challengeToken}`, MAX_ATTEMPTS_PER_TOKEN, WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: "Too many verification attempts. Try again later." });
  }

  const userId = resolveTotpChallenge(challengeToken);
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Challenge expired or invalid. Log in again." });
  }

  const user = await userService.findById(userId);
  if (!user || !user.totpEnabled || !user.totpSecret) {
    throw createError({ statusCode: 401, statusMessage: "Challenge expired or invalid. Log in again." });
  }

  const isValidTotp = totpService.verifyCode(user.totpSecret, code);
  const isValidRecovery = !isValidTotp && (await totpService.consumeRecoveryCode(userId, code));
  if (!isValidTotp && !isValidRecovery) {
    throw createError({ statusCode: 401, statusMessage: "Invalid code" });
  }

  consumeTotpChallenge(challengeToken);

  await setUserSession(event, {
    user: { id: user.id, email: user.email, displayName: user.displayName }
  });

  return { id: user.id, email: user.email, displayName: user.displayName, usedRecoveryCode: isValidRecovery };
});
