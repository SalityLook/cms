<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface InstalledPlugin {
  id: string;
  key: string;
  enabled: boolean;
  updatedAt: string;
}

const { data: plugins, refresh } = await useApiFetch<InstalledPlugin[]>("/api/plugins");
const toggling = ref<string | null>(null);

async function onToggle(plugin: InstalledPlugin) {
  toggling.value = plugin.id;
  try {
    await apiFetch(`/api/plugins/${plugin.id}`, { method: "PATCH", body: { enabled: !plugin.enabled } });
    await refresh();
  } finally {
    toggling.value = null;
  }
}
</script>

<template>
  <div>
    <PageHeader title="Plugins & Theme" description="Kelola plugin server-side aktif dan lihat theme yang dipakai." />

    <div class="max-w-2xl space-y-4">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Plugins</h2>
        </template>

        <UAlert
          color="warning"
          variant="subtle"
          title="Perubahan berlaku setelah aplikasi di-restart"
          description="Toggle di sini langsung tersimpan ke database, tapi setup() plugin server-side (hooks, capability) DAN panel editornya cuma dibaca ULANG saat proses Nitro restart (pm2 restart) -- bukan langsung aktif/nonaktif tanpa restart."
          class="mb-4"
        />

        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="plugin in plugins" :key="plugin.id" class="py-3 flex items-center justify-between gap-3">
            <div>
              <p class="font-medium text-sm text-slate-900 dark:text-white">{{ plugin.key }}</p>
              <p class="text-xs text-slate-400">{{ plugin.enabled ? "Aktif" : "Nonaktif" }}</p>
            </div>
            <USwitch :model-value="plugin.enabled" :loading="toggling === plugin.id" @update:model-value="onToggle(plugin)" />
          </li>
          <li v-if="!plugins?.length" class="py-8 text-center text-slate-400 text-sm">
            Tidak ada plugin terdaftar di <code>plugins.config.ts</code>.
          </li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Theme</h2>
        </template>
        <p class="text-sm text-slate-500 mb-1">
          Theme aktif ditentukan oleh path <code>extends</code> di <code>apps/frontend/nuxt.config.ts</code> -- resolve
          saat build/start proses, jadi halaman ini READ-ONLY (bukan switcher).
        </p>
        <p class="font-medium text-sm text-slate-900 dark:text-white mt-3">themes/default</p>
        <p class="text-xs text-slate-400">Package: @selftaught/theme-default</p>
      </UCard>
    </div>
  </div>
</template>
