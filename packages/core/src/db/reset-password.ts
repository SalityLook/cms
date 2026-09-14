import { eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";
import { db } from "./client";
import { users } from "./schema/users";

// Standalone bootstrap tool for when NO admin can log in to use the
// Users UI's "Reset Password" action (e.g. the only admin forgot their
// password) — bypasses the app entirely, talks to the DB directly.
const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: pnpm reset-password <email> <newPassword>");
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const passwordHash = await hashPassword(newPassword);
const [user] = await db
  .update(users)
  .set({ passwordHash, updatedAt: new Date() })
  .where(eq(users.email, email.toLowerCase()))
  .returning();

if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

console.log(`Password updated for ${user.email}.`);
process.exit(0);
