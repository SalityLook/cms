import { eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";
import { capabilityRegistry, SYSTEM_ROLES } from "../registry/capabilities";
import { db } from "./client";
import { capabilities, roleCapabilities, roles, userRoles, users } from "./schema/users";

async function seedCapabilities() {
  for (const definition of capabilityRegistry.list()) {
    await db.insert(capabilities).values({ key: definition.key }).onConflictDoNothing();
  }
}

async function seedRoles() {
  for (const [roleKey, definition] of Object.entries(SYSTEM_ROLES)) {
    await db
      .insert(roles)
      .values({ key: roleKey, name: definition.name, description: definition.description, isSystem: true })
      .onConflictDoNothing();

    const role = await db.query.roles.findFirst({ where: eq(roles.key, roleKey) });
    if (!role) continue;

    for (const capabilityKey of definition.capabilities) {
      const capability = await db.query.capabilities.findFirst({ where: eq(capabilities.key, capabilityKey) });
      if (!capability) continue;
      await db
        .insert(roleCapabilities)
        .values({ roleId: role.id, capabilityId: capability.id })
        .onConflictDoNothing();
    }
  }
}

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123!";

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    console.log(`Admin user already exists (${email}), skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const [admin] = await db
    .insert(users)
    .values({ email, passwordHash, displayName: "Administrator" })
    .returning();

  const adminRole = await db.query.roles.findFirst({ where: eq(roles.key, "admin") });
  if (admin && adminRole) {
    await db.insert(userRoles).values({ userId: admin.id, roleId: adminRole.id }).onConflictDoNothing();
  }

  console.log(`Seeded admin user: ${email} / ${password} — change this password after first login.`);
}

await seedCapabilities();
await seedRoles();
await seedAdminUser();
console.log("Seed complete.");
process.exit(0);
