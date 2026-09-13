import type { CapabilityKey } from "../../registry/capabilities";
import type { Actor } from "../../shared/types";
import type { RoleService } from "./role-service";
import type { UserService } from "./user-service";

export class PermissionService {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService
  ) {}

  async loadActor(userId: string): Promise<Actor | null> {
    const user = await this.userService.findById(userId);
    if (!user) {
      return null;
    }
    const [roleKeys, capabilityKeys] = await Promise.all([
      this.roleService.rolesForUser(userId),
      this.roleService.capabilitiesForUser(userId)
    ]);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: roleKeys,
      capabilities: capabilityKeys
    };
  }

  can(actor: Actor | null | undefined, capability: CapabilityKey): boolean {
    return !!actor && actor.capabilities.includes(capability);
  }
}
