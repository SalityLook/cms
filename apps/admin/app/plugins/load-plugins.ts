import ExamplePluginEditorPanel from "@selftaught/example-plugin/editor-panel";
import { adminUIRegistry } from "../utils/admin-ui-registry";

/**
 * Vue-side counterpart to plugins.config.ts / server/plugins/00.load-plugins.ts
 * — registers each active plugin's admin UI pieces (editor panels, menu
 * items). Kept separate from the server-side loader because components only
 * make sense in the Vue app context, not the Nitro server context.
 */
export default defineNuxtPlugin(() => {
  adminUIRegistry.registerEditorPanel("post", ExamplePluginEditorPanel);
});
