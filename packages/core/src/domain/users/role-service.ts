import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { capabilities, roleCapabilities, roles, userRoles } from "../../db/schema/users";
import type { CapabilityKey } from "../../registry/capabilities";

export class RoleService {
  constructor(private readonly db: Database) {}

  listRoles() {
    return this.db.query.roles.findMany();
  }

  getRoleByKey(key: string) {
    return this.db.query.roles.findFirst({ where: eq(roles.key, key) });
  }

  async assignRole(userId: string, roleKey: string) {
    const role = await this.getRoleByKey(roleKey);
    if (!role) {
      throw new Error(`Unknown role: ${roleKey}`);
    }
    await this.db.insert(userRoles).values({ userId, roleId: role.id }).onConflictDoNothing();
  }

  async capabilitiesForUser(userId: string): Promise<CapabilityKey[]> {
    const rows = await this.db
      .select({ key: capabilities.key })
      .from(userRoles)
      .innerJoin(roleCapabilities, eq(roleCapabilities.roleId, userRoles.roleId))
      .innerJoin(capabilities, eq(capabilities.id, roleCapabilities.capabilityId))
      .where(eq(userRoles.userId, userId));
    return [...new Set(rows.map((row) => row.key))] as CapabilityKey[];
  }

  async rolesForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: roles.key })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, userId));
    return rows.map((row) => row.key);
  }
}
