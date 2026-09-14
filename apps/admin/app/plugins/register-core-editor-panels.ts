import CustomFieldsPanel from "../components/CustomFieldsPanel.vue";
import { adminUIRegistry } from "../utils/admin-ui-registry";

/**
 * Editor panels that are part of the CMS core (not a third-party plugin) --
 * kept separate from app/plugins/load-plugins.ts, which is specifically the
 * Vue-side loader for plugins.config.ts entries. Registering a core panel
 * through the plugin loader would misleadingly suggest it could be
 * toggled off the same way a plugin can.
 */
export default defineNuxtPlugin(() => {
  adminUIRegistry.registerEditorPanel("post", CustomFieldsPanel);
  adminUIRegistry.registerEditorPanel("page", CustomFieldsPanel);
});
