import { randomUUID } from "node:crypto";

/**
 * In-memory, same posture as rate-limit.ts (single self-hosted instance
 * target -- see CLAUDE.md architecture decision #4). Holds a short-lived
 * mapping from an opaque challenge token to the userId that passed the
 * password check but still needs to submit a valid TOTP/recovery code
 * before a real session is created. Never survives a process restart --
 * a login mid-challenge across a deploy just has to log in again.
 */
interface Challenge {
  userId: string;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000;
const challenges = new Map<string, Challenge>();

function sweepExpired(now: number) {
  for (const [token, challenge] of challenges) {
    if (now > challenge.expiresAt) {
      challenges.delete(token);
    }
  }
}

export function createTotpChallenge(userId: string): string {
  const now = Date.now();
  if (challenges.size > 10_000) {
    sweepExpired(now);
  }
  const token = randomUUID();
  challenges.set(token, { userId, expiresAt: now + TTL_MS });
  return token;
}

export function resolveTotpChallenge(token: string): string | null {
  const challenge = challenges.get(token);
  if (!challenge || Date.now() > challenge.expiresAt) {
    challenges.delete(token);
    return null;
  }
  return challenge.userId;
}

export function consumeTotpChallenge(token: string): void {
  challenges.delete(token);
}
