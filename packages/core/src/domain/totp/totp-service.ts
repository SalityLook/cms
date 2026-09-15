import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { hashPassword, verifyPassword } from "../../auth/password";
import type { Database } from "../../db/client";
import { totpRecoveryCodes, users } from "../../db/schema/users";
import { ValidationError } from "../../errors";

export interface TotpSetup {
  secret: string;
  qrDataUrl: string;
}

const ISSUER = "SelfTaught CMS";
const RECOVERY_CODE_COUNT = 8;

export class TotpService {
  constructor(private readonly db: Database) {}

  /**
   * Step 1 of the two-step setup flow: generates and stores a NEW secret
   * on the user row but leaves totpEnabled false. Storing it before it's
   * confirmed is deliberate and harmless -- an abandoned setup just leaves
   * an unused secret that gets overwritten by the next setup attempt;
   * totpEnabled (checked at login) is what actually gates anything.
   */
  async startSetup(userId: string, email: string): Promise<TotpSetup> {
    const secret = new Secret({ size: 20 });
    const totp = new TOTP({ issuer: ISSUER, label: email, secret });
    await this.db.update(users).set({ totpSecret: secret.base32, updatedAt: new Date() }).where(eq(users.id, userId));
    const qrDataUrl = await QRCode.toDataURL(totp.toString());
    return { secret: secret.base32, qrDataUrl };
  }

  /** Step 2: verify a real code against the just-stored secret before flipping totpEnabled on -- so a typo'd setup can't lock the account out. */
  async confirmSetup(userId: string, code: string): Promise<string[]> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user?.totpSecret) {
      throw new ValidationError("No pending TOTP setup for this account");
    }
    if (!this.verifyCode(user.totpSecret, code)) {
      throw new ValidationError("Invalid verification code");
    }
    await this.db.update(users).set({ totpEnabled: true, updatedAt: new Date() }).where(eq(users.id, userId));
    return this.regenerateRecoveryCodes(userId);
  }

  async disable(userId: string): Promise<void> {
    await this.db.update(users).set({ totpEnabled: false, totpSecret: null, updatedAt: new Date() }).where(eq(users.id, userId));
    await this.db.delete(totpRecoveryCodes).where(eq(totpRecoveryCodes.userId, userId));
  }

  verifyCode(secretBase32: string, code: string): boolean {
    const totp = new TOTP({ secret: Secret.fromBase32(secretBase32) });
    // window: 1 tolerates the previous/next 30s step for clock drift, same
    // margin most TOTP apps/servers use.
    return totp.validate({ token: code, window: 1 }) !== null;
  }

  /** Called once at confirmSetup() -- invalidates any previously issued codes, since re-enabling should not silently keep old codes valid. */
  private async regenerateRecoveryCodes(userId: string): Promise<string[]> {
    await this.db.delete(totpRecoveryCodes).where(eq(totpRecoveryCodes.userId, userId));
    const codes: string[] = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const code = randomBytes(5).toString("hex");
      codes.push(code);
      const codeHash = await hashPassword(code);
      await this.db.insert(totpRecoveryCodes).values({ userId, codeHash });
    }
    return codes;
  }

  /** One-time use: marks the matching code as used so it can never be replayed. */
  async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const candidates = await this.db.query.totpRecoveryCodes.findMany({
      where: and(eq(totpRecoveryCodes.userId, userId), isNull(totpRecoveryCodes.usedAt))
    });
    for (const candidate of candidates) {
      if (await verifyPassword(candidate.codeHash, code)) {
        await this.db.update(totpRecoveryCodes).set({ usedAt: new Date() }).where(eq(totpRecoveryCodes.id, candidate.id));
        return true;
      }
    }
    return false;
  }
}
