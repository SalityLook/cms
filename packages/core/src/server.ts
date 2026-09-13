// Server-only exports: DB client, domain services, hooks, registries.
// Import only from server/ directories in the Nuxt apps — never from app/pages/components.
export * from "./auth/password";
export * from "./db/client";
export * from "./domain/content/index";
export * from "./domain/users/index";

import { db } from "./db/client";
import { ContentService } from "./domain/content/content-service";
import { PermissionService } from "./domain/users/permission-service";
import { RoleService } from "./domain/users/role-service";
import { UserService } from "./domain/users/user-service";

export const userService = new UserService(db);
export const roleService = new RoleService(db);
export const permissionService = new PermissionService(roleService, userService);
export const contentService = new ContentService(db);
