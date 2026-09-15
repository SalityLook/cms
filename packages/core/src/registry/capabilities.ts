// Built-in capability keys. `CapabilityKey` stays a compile-time literal union
// (autocomplete/typo-safety at every requireCapability("...") call site) —
// plugin-added capabilities go through CapabilityRegistry.register() below as
// plain strings instead, since the compiler can't know about them ahead of
// time. Both end up in the same DB `capabilities` table either way.
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
  "manage_plugins",
  "moderate_comments",
  "manage_menus",
  "manage_import_export"
] as const;

export type CapabilityKey = (typeof CAPABILITIES)[number];

export interface CapabilityDefinition {
  key: string;
  description?: string;
}

class CapabilityRegistryImpl {
  private readonly capabilities = new Map<string, CapabilityDefinition>();

  constructor(seed: readonly string[]) {
    for (const key of seed) {
      this.capabilities.set(key, { key });
    }
  }

  register(definition: CapabilityDefinition) {
    this.capabilities.set(definition.key, definition);
  }

  list(): CapabilityDefinition[] {
    return [...this.capabilities.values()];
  }

  has(key: string): boolean {
    return this.capabilities.has(key);
  }
}

export const capabilityRegistry = new CapabilityRegistryImpl(CAPABILITIES);

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
      "manage_categories",
      "moderate_comments",
      "manage_menus"
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
  },
  subscriber: {
    name: "Subscriber",
    description: "Self-registered public account. Zero capabilities -- can log into the public site but never the admin.",
    capabilities: [] satisfies CapabilityKey[]
  }
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;
