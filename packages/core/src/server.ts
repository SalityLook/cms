// Server-only exports: DB client, domain services, hooks, registries.
// Import only from server/ directories in the Nuxt apps — never from app/pages/components.
export * from "./auth/password";
export * from "./db/client";
export * from "./domain/comments/index";
export * from "./domain/content/index";
export * from "./domain/media/index";
export * from "./domain/menus/index";
export * from "./domain/reusable-blocks/index";
export * from "./domain/revisions/index";
export * from "./domain/search/index";
export * from "./domain/seo/index";
export * from "./domain/settings/index";
export * from "./domain/taxonomy/index";
export * from "./domain/users/index";
export * from "./errors";
export * from "./hooks/hook-bus";
export * from "./plugins/define-plugin";
export * from "./registry/capabilities";

import { db } from "./db/client";
import { CommentService } from "./domain/comments/comment-service";
import { ContentMetaService } from "./domain/content/content-meta-service";
import { ContentService } from "./domain/content/content-service";
import { LocalDiskStorage } from "./domain/media/local-disk-storage";
import { MediaService } from "./domain/media/media-service";
import { MenuService } from "./domain/menus/menu-service";
import { ReusableBlockService } from "./domain/reusable-blocks/reusable-block-service";
import { RevisionService } from "./domain/revisions/revision-service";
import { SearchService } from "./domain/search/search-service";
import { SeoService } from "./domain/seo/seo-service";
import { SettingsService } from "./domain/settings/settings-service";
import { TaxonomyService } from "./domain/taxonomy/taxonomy-service";
import { PermissionService } from "./domain/users/permission-service";
import { RoleService } from "./domain/users/role-service";
import { UserService } from "./domain/users/user-service";

export const userService = new UserService(db);
export const roleService = new RoleService(db);
export const permissionService = new PermissionService(roleService, userService);
export const revisionService = new RevisionService(db);
export const contentService = new ContentService(db, revisionService);
export const contentMetaService = new ContentMetaService(db);
export const taxonomyService = new TaxonomyService(db);
export const settingsService = new SettingsService(db);
export const commentService = new CommentService(db);
export const menuService = new MenuService(db);
export const searchService = new SearchService(db);
export const reusableBlockService = new ReusableBlockService(db);

const mediaStorage = new LocalDiskStorage(process.env.MEDIA_LOCAL_PATH ?? "../../data/media");
export const mediaService = new MediaService(db, mediaStorage);
export const seoService = new SeoService(db, mediaService, settingsService);
