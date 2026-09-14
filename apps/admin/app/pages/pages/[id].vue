<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const id = route.params.id as string;

const { data: page, refresh } = await useApiFetch<PageDetail>(`/api/pages/${id}`);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

const { data: mediaData } = await useApiFetch<Paginated<MediaItem>>("/api/media");
const mediaItems = computed(() => mediaData.value?.items ?? []);
const { data: otherPagesData } = await useApiFetch<Paginated<PageSummary>>("/api/pages");
const otherPages = computed(() => otherPagesData.value?.items ?? []);
const { data: revisions, refresh: refreshRevisions } = await useApiFetch<RevisionSummary[]>(`/api/pages/${id}/revisions`);
const { data: seo } = await useApiFetch<ContentSeo | null>(`/api/pages/${id}/seo`);

const title = ref(page.value.title);
const slug = ref(page.value.slug);
const excerpt = ref(page.value.excerpt ?? "");
const doc = ref<ContentDocument>(page.value.content as ContentDocument);
const featuredMediaId = ref<string | null>(page.value.featuredMediaId);
const parentId = ref<string | null>(page.value.parentId);
const menuOrder = ref(page.value.menuOrder);
const saving = ref(false);
const error = ref("");
const showScheduleInput = ref(false);
const scheduledAt = ref("");

const seoTitle = ref(seo.value?.title ?? "");
const seoDescription = ref(seo.value?.description ?? "");
const seoOgImageId = ref<string | null>(seo.value?.ogImageMediaId ?? null);
const seoCanonicalUrl = ref(seo.value?.canonicalUrl ?? "");
const seoNoindex = ref(seo.value?.noindex ?? false);

const statusColor: Record<string, "neutral" | "success" | "warning" | "info" | "error"> = {
  draft: "neutral",
  published: "success",
  pending: "warning",
  scheduled: "info",
  trashed: "error"
};

const selectablePages = computed(() => otherPages.value?.filter((p) => p.id !== id) ?? []);
const parentOptions = computed(() => [
  { label: "(tidak ada — top-level)", value: null },
  ...selectablePages.value.map((p) => ({ label: p.title || "(Tanpa judul)", value: p.id }))
]);

async function withErrorHandling(action: () => Promise<unknown>) {
  error.value = "";
  try {
    await action();
    await Promise.all([refresh(), refreshRevisions()]);
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Terjadi kesalahan.";
  }
}

async function onSave() {
  saving.value = true;
  await withErrorHandling(() =>
    Promise.all([
      apiFetch(`/api/pages/${id}`, {
        method: "PATCH",
        body: {
          title: title.value,
          slug: slug.value,
          excerpt: excerpt.value || undefined,
          content: doc.value,
          featuredMediaId: featuredMediaId.value,
          parentId: parentId.value,
          menuOrder: menuOrder.value
        }
      }),
      apiFetch(`/api/pages/${id}/seo`, {
        method: "PUT",
        body: {
          title: seoTitle.value || null,
          description: seoDescription.value || null,
          ogImageMediaId: seoOgImageId.value,
          canonicalUrl: seoCanonicalUrl.value || null,
          noindex: seoNoindex.value
        }
      })
    ])
  );
  saving.value = false;
}

const onPublish = () => withErrorHandling(() => apiFetch(`/api/pages/${id}/publish`, { method: "POST" }));
const onUnpublish = () => withErrorHandling(() => apiFetch(`/api/pages/${id}/unpublish`, { method: "POST" }));
const onSubmit = () => withErrorHandling(() => apiFetch(`/api/pages/${id}/submit`, { method: "POST" }));
const onTrash = () => withErrorHandling(() => apiFetch(`/api/pages/${id}/trash`, { method: "POST" }));
const onUntrash = () => withErrorHandling(() => apiFetch(`/api/pages/${id}/untrash`, { method: "POST" }));

async function onConfirmSchedule() {
  if (!scheduledAt.value) return;
  await withErrorHandling(() =>
    apiFetch(`/api/pages/${id}/schedule`, { method: "POST", body: { scheduledAt: new Date(scheduledAt.value).toISOString() } })
  );
  showScheduleInput.value = false;
}

async function onRestoreRevision(revisionId: string) {
  await withErrorHandling(() => apiFetch(`/api/pages/${id}/revisions/${revisionId}/restore`, { method: "POST" }));
  if (page.value) {
    title.value = page.value.title;
    slug.value = page.value.slug;
    excerpt.value = page.value.excerpt ?? "";
    doc.value = page.value.content as ContentDocument;
  }
}

async function onDelete() {
  await apiFetch(`/api/pages/${id}`, { method: "DELETE" });
  await navigateTo("/pages");
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
      <div class="min-w-0">
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <NuxtLink to="/pages" class="hover:text-slate-600 dark:hover:text-slate-300">Pages</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
        </div>
        <div class="flex items-center gap-2 min-w-0">
          <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white truncate">
            {{ page?.title || "(Tanpa judul)" }}
          </h1>
          <UBadge :color="statusColor[page?.status ?? 'draft']" variant="subtle" class="shrink-0">{{ page?.status }}</UBadge>
        </div>
      </div>

      <div v-if="page?.status === 'trashed'" class="flex items-center gap-2 shrink-0">
        <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="onUntrash">Pulihkan</UButton>
        <UButton color="error" icon="i-lucide-trash-2" @click="onDelete">Hapus Permanen</UButton>
      </div>
      <div v-else class="flex items-center gap-2 flex-wrap shrink-0">
        <UButton variant="ghost" color="neutral" :loading="saving" icon="i-lucide-save" @click="onSave">Simpan</UButton>

        <UButton v-if="page?.status === 'draft'" color="neutral" variant="outline" @click="onSubmit">Ajukan Review</UButton>
        <UButton v-if="page?.status === 'pending'" color="neutral" variant="outline" @click="onUnpublish">Kembalikan ke Draft</UButton>
        <UButton v-if="page?.status === 'scheduled'" color="neutral" variant="outline" @click="onUnpublish">Batalkan Jadwal</UButton>

        <UButton
          v-if="page?.status === 'draft' || page?.status === 'pending'"
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-clock"
          @click="showScheduleInput = !showScheduleInput"
        >
          Jadwalkan
        </UButton>

        <UButton v-if="page?.status !== 'published'" color="success" icon="i-lucide-send" @click="onPublish">
          {{ page?.status === "scheduled" ? "Publish Sekarang" : "Publish" }}
        </UButton>
        <UButton v-else color="neutral" variant="outline" @click="onUnpublish">Batalkan Publish</UButton>

        <UButton color="error" variant="ghost" icon="i-lucide-trash-2" @click="onTrash" />
      </div>
    </div>

    <UCard v-if="showScheduleInput" class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <UFormField label="Jadwalkan publikasi" class="flex-1">
          <UInput v-model="scheduledAt" type="datetime-local" class="w-full" />
        </UFormField>
        <UButton icon="i-lucide-check" @click="onConfirmSchedule">Konfirmasi Jadwal</UButton>
      </div>
    </UCard>

    <UAlert v-if="error" color="error" variant="subtle" :title="error" class="mb-6" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4 min-w-0">
        <UCard>
          <div class="space-y-4">
            <UFormField label="Judul">
              <UInput v-model="title" class="w-full" size="lg" />
            </UFormField>
            <UFormField label="Slug">
              <UInput v-model="slug" class="w-full" />
            </UFormField>
            <UFormField label="Ringkasan (opsional)">
              <UTextarea v-model="excerpt" class="w-full" :rows="2" />
            </UFormField>
          </div>
        </UCard>

        <BlockEditor v-model="doc" />

        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm">SEO</h2>
          </template>
          <div class="space-y-4">
            <UFormField label="SEO Title (opsional, fallback ke Judul)">
              <UInput v-model="seoTitle" class="w-full" />
            </UFormField>
            <UFormField label="Meta Description (opsional, fallback ke Ringkasan)">
              <UTextarea v-model="seoDescription" class="w-full" :rows="2" />
            </UFormField>
            <UFormField label="Canonical URL (opsional)">
              <UInput v-model="seoCanonicalUrl" class="w-full" placeholder="https://..." />
            </UFormField>
            <div>
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">OG Image (opsional, fallback ke Gambar Unggulan)</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="item in mediaItems"
                  :key="item.id"
                  type="button"
                  class="border-2 rounded-lg overflow-hidden transition-colors"
                  :class="seoOgImageId === item.id ? 'border-brand-500' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'"
                  @click="seoOgImageId = seoOgImageId === item.id ? null : item.id"
                >
                  <img :src="item.url" :alt="item.altText ?? ''" class="w-12 h-12 object-cover">
                </button>
              </div>
            </div>
            <USwitch v-model="seoNoindex" label="Noindex (sembunyikan dari mesin pencari)" />
          </div>
        </UCard>
      </div>

      <div class="space-y-4 min-w-0">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Gambar Unggulan</h2>
          </template>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in mediaItems"
              :key="item.id"
              type="button"
              class="border-2 rounded-lg overflow-hidden transition-colors"
              :class="featuredMediaId === item.id ? 'border-brand-500' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'"
              @click="featuredMediaId = featuredMediaId === item.id ? null : item.id"
            >
              <img :src="item.url" :alt="item.altText ?? ''" class="w-16 h-16 object-cover">
            </button>
            <p v-if="!mediaItems?.length" class="text-slate-400 text-sm">
              Belum ada media. Upload dulu di halaman <NuxtLink to="/media" class="underline">Media</NuxtLink>.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Hierarki</h2>
          </template>
          <div class="space-y-4">
            <UFormField label="Parent Page (opsional)">
              <USelectMenu v-model="parentId" :items="parentOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Urutan Menu">
              <UInput v-model.number="menuOrder" type="number" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Revisions</h2>
          </template>
          <ul class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="rev in revisions" :key="rev.id" class="py-2.5 flex items-center justify-between gap-2">
              <span class="text-xs text-slate-500 truncate">{{ rev.title }} — {{ new Date(rev.createdAt).toLocaleString() }}</span>
              <UButton size="xs" variant="outline" class="shrink-0" @click="onRestoreRevision(rev.id)">Pulihkan</UButton>
            </li>
            <li v-if="!revisions?.length" class="py-4 text-center text-slate-400 text-sm">Belum ada revisi tersimpan.</li>
          </ul>
        </UCard>
      </div>
    </div>
  </div>
</template>
