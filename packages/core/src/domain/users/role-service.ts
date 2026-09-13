import { and, eq } from "drizzle-orm";
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

  async removeRole(userId: string, roleKey: string): Promise<void> {
    const role = await this.getRoleByKey(roleKey);
    if (!role) {
      return;
    }
    await this.db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)));
  }

  /** Replaces a user's full role set in one call — diffs against current roles so it's just the add/remove needed. */
  async setRolesForUser(userId: string, roleKeys: string[]): Promise<void> {
    const current = await this.rolesForUser(userId);
    const toAdd = roleKeys.filter((key) => !current.includes(key));
    const toRemove = current.filter((key) => !roleKeys.includes(key));
    await Promise.all([
      ...toAdd.map((key) => this.assignRole(userId, key)),
      ...toRemove.map((key) => this.removeRole(userId, key))
    ]);
  }

  listCapabilities() {
    return this.db.query.capabilities.findMany({ orderBy: (row, { asc }) => [asc(row.key)] });
  }

  async capabilitiesForRole(roleKey: string): Promise<string[]> {
    const role = await this.getRoleByKey(roleKey);
    if (!role) {
      return [];
    }
    const rows = await this.db
      .select({ key: capabilities.key })
      .from(roleCapabilities)
      .innerJoin(capabilities, eq(capabilities.id, roleCapabilities.capabilityId))
      .where(eq(roleCapabilities.roleId, role.id));
    return rows.map((row) => row.key);
  }

  /** Idempotently ensures each key exists as a row in `capabilities` — called at plugin-load time so plugin-registered capabilities become assignable. */
  async syncCapabilities(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.db.insert(capabilities).values({ key }).onConflictDoNothing();
    }
  }

  /** Grants a capability to a role if both exist. Used to keep the "admin" role complete as plugins add capabilities. */
  async grantCapabilityToRole(roleKey: string, capabilityKey: string): Promise<void> {
    const role = await this.getRoleByKey(roleKey);
    const capability = await this.db.query.capabilities.findFirst({ where: eq(capabilities.key, capabilityKey) });
    if (!role || !capability) {
      return;
    }
    await this.db.insert(roleCapabilities).values({ roleId: role.id, capabilityId: capability.id }).onConflictDoNothing();
  }
}
