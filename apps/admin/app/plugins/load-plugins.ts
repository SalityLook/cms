import ExamplePluginEditorPanel from "@selftaught/example-plugin/editor-panel";
import { adminUIRegistry } from "../utils/admin-ui-registry";

/**
 * Vue-side counterpart to plugins.config.ts / server/plugins/00.load-plugins.ts
 * — registers each active plugin's admin UI pieces (editor panels, menu
 * items). Kept separate from the server-side loader because components only
 * make sense in the Vue app context, not the Nitro server context.
 *
 * Checks GET /api/plugins/enabled (Phase 21) so a disabled plugin's panel
 * stops being registered too, not just its server-side hooks. In practice
 * this ALSO only fully takes effect after a process restart, same as the
 * server-side toggle: this plugin function re-runs on every SSR render and
 * reads the current DB state fresh each time, but adminUIRegistry is a
 * module-level singleton that outlives any single request -- once a panel
 * has been registered while the plugin was enabled, disabling it later in
 * the SAME running process can't un-register that already-registered
 * component (see the dedup note on registerEditorPanel() for why re-runs
 * don't duplicate it further, but they also can't remove it).
 *
 * Uses apiFetch() (apps/admin/app/utils/api.ts), not plain $fetch -- the
 * same Gotcha #17 lesson applies here too: plain $fetch inside a Nuxt
 * plugin during SSR is NOT request-scoped and won't forward the incoming
 * request's session cookie, so the server-side render would always see
 * "not logged in" and silently skip registering the panel even when the
 * plugin is enabled (only client-side hydration would show it, with a
 * visible pop-in). apiFetch already wraps useRequestFetch() correctly --
 * reuse it here rather than re-deriving the same fix by hand.
 */
export default defineNuxtPlugin(async () => {
  try {
    const enabled = await apiFetch<string[]>("/api/plugins/enabled");
    if (enabled.includes("example-plugin")) {
      adminUIRegistry.registerEditorPanel("post", ExamplePluginEditorPanel);
    }
  } catch {
    // Not logged in yet (e.g. rendering /login) -- no panels to register.
  }
});
