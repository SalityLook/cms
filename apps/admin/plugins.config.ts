import examplePlugin from "@selftaught/example-plugin/server";

/**
 * Which first-party plugins are active in this app. Loaded once at boot by
 * server/plugins/00.load-plugins.ts. A plugin package's own Vue-side pieces
 * (editor panels etc.) are wired up separately in app/plugins/load-plugins.ts
 * — this file is server-side only.
 */
export const plugins = [examplePlugin];
