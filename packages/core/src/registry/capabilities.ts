// Built-in capability keys. Plugins register additional keys later via
// CapabilityRegistry.register() (Phase 7) — this const list seeds the DB
// in Phase 1 and gives call sites autocomplete/type-safety today.
export const CAPABILITIES = [
  "edit_posts",
  "edit_others_posts",
  "publish_posts",
  "delete_posts",
  "edit_pages",
  "manage_media",
  "manage_categories",
  "manage_users",
  "manage_settings",
  "manage_plugins"
] as const;

export type CapabilityKey = (typeof CAPABILITIES)[number];

export const SYSTEM_ROLES = {
  admin: {
    name: "Administrator",
    description: "Full access to every capability.",
    capabilities: CAPABILITIES as readonly CapabilityKey[]
  },
  editor: {
    name: "Editor",
    description: "Publishes and manages all content, media and taxonomies.",
    capabilities: [
      "edit_posts",
      "edit_others_posts",
      "publish_posts",
      "delete_posts",
      "edit_pages",
      "manage_media",
      "manage_categories"
    ] satisfies CapabilityKey[]
  },
  author: {
    name: "Author",
    description: "Publishes and manages their own content.",
    capabilities: ["edit_posts", "publish_posts", "delete_posts", "manage_media"] satisfies CapabilityKey[]
  },
  contributor: {
    name: "Contributor",
    description: "Drafts content for review; cannot publish.",
    capabilities: ["edit_posts"] satisfies CapabilityKey[]
  }
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;
