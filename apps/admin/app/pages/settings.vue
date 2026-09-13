<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: settings, refresh } = await useApiFetch<SettingsMap>("/api/settings");
const { data: mediaItems } = await useApiFetch<MediaItem[]>("/api/media");

const siteName = ref((settings.value?.siteName as string) ?? "");
const siteDescription = ref((settings.value?.siteDescription as string) ?? "");
const defaultOgImageMediaId = ref<string | null>((settings.value?.defaultOgImageMediaId as string) ?? null);
const discourageSearchEngines = ref(Boolean(settings.value?.discourageSearchEngines));
const saving = ref(false);

async function onSave() {
  saving.value = true;
  await apiFetch("/api/settings", {
    method: "PATCH",
    body: {
      siteName: siteName.value,
      siteDescription: siteDescription.value,
      defaultOgImageMediaId: defaultOgImageMediaId.value,
      discourageSearchEngines: discourageSearchEngines.value
    }
  });
  await refresh();
  saving.value = false;
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="font-semibold">SelfTaught CMS</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>Settings</span>
      </div>
      <UButton :loading="saving" @click="onSave">Simpan</UButton>
    </header>

    <main class="p-6 max-w-2xl mx-auto space-y-4">
      <UCard>
        <h2 class="font-medium mb-3">General</h2>
        <div class="space-y-4">
          <UFormField label="Nama Situs">
            <UInput v-model="siteName" class="w-full" />
          </UFormField>
          <UFormField label="Deskripsi Situs (fallback SEO description)">
            <UTextarea v-model="siteDescription" class="w-full" :rows="2" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <h2 class="font-medium mb-3">SEO Default</h2>
        <p class="text-sm font-medium mb-2">Default OG Image</p>
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="item in mediaItems"
            :key="item.id"
            type="button"
            class="border-2 rounded-md overflow-hidden"
            :class="defaultOgImageMediaId === item.id ? 'border-primary' : 'border-transparent'"
            @click="defaultOgImageMediaId = defaultOgImageMediaId === item.id ? null : item.id"
          >
            <img :src="item.url" :alt="item.altText ?? ''" class="w-12 h-12 object-cover">
          </button>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="discourageSearchEngines" type="checkbox">
          Cegah mesin pencari mengindeks situs ini (robots.txt disallow all)
        </label>
      </UCard>
    </main>
  </div>
</template>
