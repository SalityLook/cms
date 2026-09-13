import { capabilityRegistry, createPluginContext, roleService } from "@selftaught/core/server";
import { plugins } from "../../plugins.config";

export default defineNitroPlugin(async () => {
  const ctx = createPluginContext();

  for (const plugin of plugins) {
    await plugin.setup(ctx);
  }

  // Make any plugin-registered capabilities assignable, and keep the
  // "admin" role complete (it's meant to have every capability, including
  // ones plugins add after core's own SYSTEM_ROLES was defined).
  const keys = capabilityRegistry.list().map((definition) => definition.key);
  await roleService.syncCapabilities(keys);
  await Promise.all(keys.map((key) => roleService.grantCapabilityToRole("admin", key)));

  console.log(`[plugins] loaded ${plugins.length} plugin(s): ${plugins.map((p) => p.id).join(", ") || "(none)"}`);
});
