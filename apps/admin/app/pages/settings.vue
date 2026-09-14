<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: settings, refresh } = await useApiFetch<SettingsMap>("/api/settings");
const { data: mediaItems } = await useApiFetch<MediaItem[]>("/api/media");

const siteName = ref((settings.value?.siteName as string) ?? "");
const siteDescription = ref((settings.value?.siteDescription as string) ?? "");
const siteLogoMediaId = ref<string | null>((settings.value?.siteLogoMediaId as string) ?? null);
const siteFaviconMediaId = ref<string | null>((settings.value?.siteFaviconMediaId as string) ?? null);
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
      siteLogoMediaId: siteLogoMediaId.value,
      siteFaviconMediaId: siteFaviconMediaId.value,
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
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Site Identity</h2>
        </template>
        <p class="text-xs text-slate-400 mb-4">
          Ganti logo &amp; favicon bawaan SelfTaught dengan milik sekolah/organisasi Anda sendiri. Kosongkan untuk
          kembali ke logo default SelfTaught.
        </p>

        <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo</p>
        <div class="flex flex-wrap items-center gap-2 mb-5">
          <button
            v-for="item in mediaItems"
            :key="item.id"
            type="button"
            class="border-2 rounded-lg overflow-hidden transition-colors bg-slate-50 dark:bg-slate-900"
            :class="siteLogoMediaId === item.id ? 'border-brand-500' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'"
            @click="siteLogoMediaId = siteLogoMediaId === item.id ? null : item.id"
          >
            <img :src="item.url" :alt="item.altText ?? ''" class="h-14 w-auto max-w-32 object-contain">
          </button>
          <p v-if="!mediaItems?.length" class="text-sm text-slate-400">
            Belum ada media. Upload logo di halaman <NuxtLink to="/media" class="underline">Media</NuxtLink> dulu.
          </p>
        </div>

        <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Favicon</p>
        <div class="flex flex-wrap items-center gap-2 mb-6">
          <button
            v-for="item in mediaItems"
            :key="item.id"
            type="button"
            class="border-2 rounded-lg overflow-hidden transition-colors bg-slate-50 dark:bg-slate-900"
            :class="siteFaviconMediaId === item.id ? 'border-brand-500' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'"
            @click="siteFaviconMediaId = siteFaviconMediaId === item.id ? null : item.id"
          >
            <img :src="item.url" :alt="item.altText ?? ''" class="w-14 h-14 object-cover">
          </button>
          <p v-if="!mediaItems?.length" class="text-sm text-slate-400">Belum ada media.</p>
        </div>
        <p class="text-xs text-slate-400 mb-6">
          Favicon idealnya gambar persegi (mis. 512×512). Ditampilkan langsung sebagai <code>&lt;link rel="icon"&gt;</code>,
          tidak perlu format <code>.ico</code> khusus.
        </p>
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
