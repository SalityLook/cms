import { definePlugin } from "@selftaught/core/server";

/**
 * Reference plugin proving every server-side extension point actually works:
 * registering a new capability, and reacting to a core hook. See
 * EditorPanel.vue for the admin-UI side (registerEditorPanel), wired up in
 * apps/admin/app/plugins/load-plugins.ts.
 */
export default definePlugin({
  id: "example-plugin",
  setup(ctx) {
    ctx.capabilities.register({
      key: "example_plugin_capability",
      description: "Granted by example-plugin — demonstrates plugin-defined capabilities."
    });

    ctx.hooks.onAction("content:published", ({ content }) => {
      console.log(`[example-plugin] content published: ${content.type} "${content.title}" (${content.id})`);
    });
  }
});
