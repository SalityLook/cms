import { capabilityRegistry, createPluginContext, pluginService, roleService } from "@selftaught/core/server";
import { plugins } from "../../plugins.config";

export default defineNitroPlugin(async () => {
  const ctx = createPluginContext();

  // Upsert-without-clobbering: a fresh deploy registers every configured
  // plugin as enabled by default (so example-plugin keeps working with zero
  // admin action), but an admin's previous enabled=false toggle survives a
  // restart untouched.
  for (const plugin of plugins) {
    await pluginService.ensureRegistered(plugin.id);
  }

  const enabledPlugins = [];
  for (const plugin of plugins) {
    if (await pluginService.isEnabled(plugin.id)) {
      await plugin.setup(ctx);
      enabledPlugins.push(plugin);
    }
  }

  // Make any plugin-registered capabilities assignable, and keep the
  // "admin" role complete (it's meant to have every capability, including
  // ones plugins add after core's own SYSTEM_ROLES was defined).
  const keys = capabilityRegistry.list().map((definition) => definition.key);
  await roleService.syncCapabilities(keys);
  await Promise.all(keys.map((key) => roleService.grantCapabilityToRole("admin", key)));

  console.log(
    `[plugins] ${enabledPlugins.length}/${plugins.length} enabled: ${enabledPlugins.map((p) => p.id).join(", ") || "(none)"}`
  );
});
