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
  <div>
    <PageHeader title="Settings">
      <template #actions>
        <UButton :loading="saving" icon="i-lucide-check" @click="onSave">Simpan</UButton>
      </template>
    </PageHeader>

    <div class="max-w-2xl space-y-4">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">General</h2>
        </template>
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
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">SEO Default</h2>
        </template>
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default OG Image</p>
        <div class="flex flex-wrap gap-2 mb-5">
          <button
            v-for="item in mediaItems"
            :key="item.id"
            type="button"
            class="border-2 rounded-lg overflow-hidden transition-colors"
            :class="defaultOgImageMediaId === item.id ? 'border-brand-500' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'"
            @click="defaultOgImageMediaId = defaultOgImageMediaId === item.id ? null : item.id"
          >
            <img :src="item.url" :alt="item.altText ?? ''" class="w-14 h-14 object-cover">
          </button>
          <p v-if="!mediaItems?.length" class="text-sm text-slate-400">Belum ada media.</p>
        </div>
        <USwitch v-model="discourageSearchEngines" label="Cegah mesin pencari mengindeks situs ini (robots.txt disallow all)" />
      </UCard>
    </div>
  </div>
</template>
