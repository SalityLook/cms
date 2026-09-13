import { hooks } from "../hooks/hook-bus";
import { capabilityRegistry } from "../registry/capabilities";
import { contentTypeRegistry } from "../registry/content-types";
import { taxonomyRegistry } from "../registry/taxonomies";

/**
 * Deliberately code-level (a list of local packages activated in each app's
 * plugins.config.ts), not a dynamic upload/marketplace/sandbox — that's a
 * different, much larger project. This proves every extension point works:
 * hooks, content types, taxonomies, and capabilities. A block registry
 * (`@selftaught/blocks`) and admin UI registry (`apps/admin`) exist too, but
 * live in packages that already depend on `@selftaught/core` — a plugin's
 * setup() can import and call those registries directly, they don't need to
 * be threaded through this context (that would invert the dependency
 * direction core -> blocks, which is exactly what we're avoiding).
 */
export interface PluginContext {
  hooks: typeof hooks;
  contentTypes: typeof contentTypeRegistry;
  taxonomies: typeof taxonomyRegistry;
  capabilities: typeof capabilityRegistry;
}

export interface PluginDefinition {
  id: string;
  setup(ctx: PluginContext): void | Promise<void>;
}

export function definePlugin(definition: PluginDefinition): PluginDefinition {
  return definition;
}

export function createPluginContext(): PluginContext {
  return {
    hooks,
    contentTypes: contentTypeRegistry,
    taxonomies: taxonomyRegistry,
    capabilities: capabilityRegistry
  };
}
