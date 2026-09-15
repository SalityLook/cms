import { pluginService } from "@selftaught/core/server";
import { plugins } from "../../../plugins.config";

// Deliberately gated on "just authenticated" (any admin user), not
// manage_plugins -- this is informational for wiring up Vue-side editor
// panels (app/plugins/load-plugins.ts), which every user needs regardless
// of whether they can administer plugin toggles themselves.
export default defineEventHandler(async (event) => {
  if (!event.context.actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const enabled: string[] = [];
  for (const plugin of plugins) {
    if (await pluginService.isEnabled(plugin.id)) {
      enabled.push(plugin.id);
    }
  }
  return enabled;
});
