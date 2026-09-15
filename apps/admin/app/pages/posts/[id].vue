<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const id = route.params.id as string;
const editorPanels = adminUIRegistry.getEditorPanels("post");

const { data: post, refresh } = await useApiFetch<PostDetail>(`/api/posts/${id}`);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" });
}

const { data: mediaData } = await useApiFetch<Paginated<MediaItem>>("/api/media");
const mediaItems = computed(() => mediaData.value?.items ?? []);
const { data: categories } = await useApiFetch<TermSummary[]>("/api/taxonomy/category");
const { data: tags } = await useApiFetch<TermSummary[]>("/api/taxonomy/tag");
const { data: revisions, refresh: refreshRevisions } = await useApiFetch<RevisionSummary[]>(`/api/posts/${id}/revisions`);
const { data: autosaveRevision, refresh: refreshAutosave } = await useApiFetch<RevisionSummary | null>(
  `/api/posts/${id}/revisions/autosave`
);
const { data: seo } = await useApiFetch<ContentSeo | null>(`/api/posts/${id}/seo`);

const title = ref(post.value.title);
const slug = ref(post.value.slug);
const excerpt = ref(post.value.excerpt ?? "");
const doc = ref<ContentDocument>(post.value.content as ContentDocument);
const featuredMediaId = ref<string | null>(post.value.featuredMediaId);
const selectedTermIds = ref<string[]>(post.value.terms.map((term) => term.id));
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

function toggleTerm(termId: string) {
  const idx = selectedTermIds.value.indexOf(termId);
  if (idx === -1) {
    selectedTermIds.value.push(termId);
  } else {
    selectedTermIds.value.splice(idx, 1);
  }
}

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
      apiFetch(`/api/posts/${id}`, {
        method: "PATCH",
        body: {
          title: title.value,
          slug: slug.value,
          excerpt: excerpt.value || undefined,
          content: doc.value,
          featuredMediaId: featuredMediaId.value,
          termIds: selectedTermIds.value
        }
      }),
      apiFetch(`/api/posts/${id}/seo`, {
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
  lastAutosavedSnapshot = JSON.stringify({ title: title.value, excerpt: excerpt.value, doc: doc.value });
  saving.value = false;
}

const onPublish = () => withErrorHandling(() => apiFetch(`/api/posts/${id}/publish`, { method: "POST" }));
const onUnpublish = () => withErrorHandling(() => apiFetch(`/api/posts/${id}/unpublish`, { method: "POST" }));
const onSubmit = () => withErrorHandling(() => apiFetch(`/api/posts/${id}/submit`, { method: "POST" }));
const onTrash = () => withErrorHandling(() => apiFetch(`/api/posts/${id}/trash`, { method: "POST" }));
const onUntrash = () => withErrorHandling(() => apiFetch(`/api/posts/${id}/untrash`, { method: "POST" }));

async function onConfirmSchedule() {
  if (!scheduledAt.value) return;
  await withErrorHandling(() =>
    apiFetch(`/api/posts/${id}/schedule`, { method: "POST", body: { scheduledAt: new Date(scheduledAt.value).toISOString() } })
  );
  showScheduleInput.value = false;
}

async function onRestoreRevision(revisionId: string) {
  await withErrorHandling(() => apiFetch(`/api/posts/${id}/revisions/${revisionId}/restore`, { method: "POST" }));
  if (post.value) {
    title.value = post.value.title;
    slug.value = post.value.slug;
    excerpt.value = post.value.excerpt ?? "";
    doc.value = post.value.content as ContentDocument;
  }
  await refreshAutosave();
}

// Autosave: only fires when something actually changed since the last autosave/manual save,
// and never touches the main content row (PATCH) -- see ContentService.autosave().
const lastAutosavedAt = ref<Date | null>(null);
let lastAutosavedSnapshot = JSON.stringify({ title: title.value, excerpt: excerpt.value, doc: doc.value });

async function runAutosave() {
  const snapshot = JSON.stringify({ title: title.value, excerpt: excerpt.value, doc: doc.value });
  if (snapshot === lastAutosavedSnapshot) return;
  await apiFetch(`/api/posts/${id}/autosave`, {
    method: "PUT",
    body: { title: title.value || "(Tanpa judul)", excerpt: excerpt.value || undefined, content: doc.value }
  });
  lastAutosavedSnapshot = snapshot;
  lastAutosavedAt.value = new Date();
  await refreshAutosave();
}

let autosaveInterval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  autosaveInterval = setInterval(runAutosave, 30_000);
});
onBeforeUnmount(() => clearInterval(autosaveInterval));

async function onRestoreAutosave() {
  if (!autosaveRevision.value) return;
  await onRestoreRevision(autosaveRevision.value.id);
}

const diffOpen = ref(false);
const diffParts = ref<{ value: string; added?: boolean; removed?: boolean }[]>([]);
const diffLoading = ref(false);

async function onViewDiff(revisionId: string) {
  diffOpen.value = true;
  diffLoading.value = true;
  try {
    const result = await apiFetch<{ parts: { value: string; added?: boolean; removed?: boolean }[] }>(
      `/api/posts/${id}/revisions/diff`,
      { query: { from: revisionId, to: "current" } }
    );
    diffParts.value = result.parts;
  } finally {
    diffLoading.value = false;
  }
}

async function onDelete() {
  await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
  await navigateTo("/posts");
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
      <div class="min-w-0">
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <NuxtLink to="/posts" class="hover:text-slate-600 dark:hover:text-slate-300">Posts</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
        </div>
        <div class="flex items-center gap-2 min-w-0">
          <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white truncate">
            {{ post?.title || "(Tanpa judul)" }}
          </h1>
          <UBadge :color="statusColor[post?.status ?? 'draft']" variant="subtle" class="shrink-0">{{ post?.status }}</UBadge>
        </div>
      </div>

      <div v-if="post?.status === 'trashed'" class="flex items-center gap-2 shrink-0">
        <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="onUntrash">Pulihkan</UButton>
        <UButton color="error" icon="i-lucide-trash-2" @click="onDelete">Hapus Permanen</UButton>
      </div>
      <div v-else class="flex items-center gap-2 flex-wrap shrink-0">
        <span v-if="lastAutosavedAt" class="text-xs text-slate-400">
          Tersimpan otomatis pukul {{ lastAutosavedAt.toLocaleTimeString() }}
        </span>
        <UButton variant="ghost" color="neutral" :loading="saving" icon="i-lucide-save" @click="onSave">Simpan</UButton>

        <UButton v-if="post?.status === 'draft'" color="neutral" variant="outline" @click="onSubmit">Ajukan Review</UButton>
        <UButton v-if="post?.status === 'pending'" color="neutral" variant="outline" @click="onUnpublish">Kembalikan ke Draft</UButton>
        <UButton v-if="post?.status === 'scheduled'" color="neutral" variant="outline" @click="onUnpublish">Batalkan Jadwal</UButton>

        <UButton
          v-if="post?.status === 'draft' || post?.status === 'pending'"
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-clock"
          @click="showScheduleInput = !showScheduleInput"
        >
          Jadwalkan
        </UButton>

        <UButton v-if="post?.status !== 'published'" color="success" icon="i-lucide-send" @click="onPublish">
          {{ post?.status === "scheduled" ? "Publish Sekarang" : "Publish" }}
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
      <!-- Main column -->
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

        <UCard v-for="(panel, i) in editorPanels" :key="i">
          <component :is="panel" :content-id="id" />
        </UCard>
      </div>

      <!-- Sidebar -->
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
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Categories</h2>
          </template>
          <div class="flex flex-wrap gap-2 mb-5">
            <UButton
              v-for="cat in categories"
              :key="cat.id"
              size="xs"
              :color="selectedTermIds.includes(cat.id) ? 'primary' : 'neutral'"
              :variant="selectedTermIds.includes(cat.id) ? 'solid' : 'outline'"
              @click="toggleTerm(cat.id)"
            >
              {{ cat.name }}
            </UButton>
            <p v-if="!categories?.length" class="text-slate-400 text-sm">
              Belum ada category. Buat di halaman <NuxtLink to="/categories" class="underline">Categories</NuxtLink>.
            </p>
          </div>

          <template #footer>
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm mb-3">Tags</h2>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="tag in tags"
                :key="tag.id"
                size="xs"
                :color="selectedTermIds.includes(tag.id) ? 'primary' : 'neutral'"
                :variant="selectedTermIds.includes(tag.id) ? 'solid' : 'outline'"
                @click="toggleTerm(tag.id)"
              >
                {{ tag.name }}
              </UButton>
              <p v-if="!tags?.length" class="text-slate-400 text-sm">
                Belum ada tag. Buat di halaman <NuxtLink to="/tags" class="underline">Tags</NuxtLink>.
              </p>
            </div>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Revisions</h2>
          </template>

          <UAlert
            v-if="autosaveRevision"
            color="warning"
            variant="subtle"
            title="Ada autosave yang belum disimpan manual"
            :description="`Tersimpan otomatis: ${new Date(autosaveRevision.createdAt).toLocaleString()}`"
            class="mb-3"
          >
            <template #actions>
              <UButton size="xs" variant="solid" @click="onRestoreAutosave">Pulihkan dari autosave</UButton>
            </template>
          </UAlert>

          <ul class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="rev in revisions" :key="rev.id" class="py-2.5 flex items-center justify-between gap-2">
              <span class="text-xs text-slate-500 truncate">{{ rev.title }} — {{ new Date(rev.createdAt).toLocaleString() }}</span>
              <div class="flex items-center gap-1 shrink-0">
                <UButton size="xs" variant="ghost" color="neutral" @click="onViewDiff(rev.id)">Diff</UButton>
                <UButton size="xs" variant="outline" @click="onRestoreRevision(rev.id)">Pulihkan</UButton>
              </div>
            </li>
            <li v-if="!revisions?.length" class="py-4 text-center text-slate-400 text-sm">Belum ada revisi tersimpan.</li>
          </ul>
        </UCard>
      </div>
    </div>

    <USlideover v-model:open="diffOpen" :ui="{ content: 'w-full max-w-xl' }">
      <template #content>
        <div class="p-4">
          <h2 class="font-semibold text-slate-900 dark:text-white mb-4">Diff: revisi vs konten saat ini</h2>
          <p v-if="diffLoading" class="text-sm text-slate-400">Memuat...</p>
          <p v-else-if="!diffParts.length" class="text-sm text-slate-400">Tidak ada perbedaan teks.</p>
          <p v-else class="text-sm leading-relaxed">
            <span
              v-for="(part, i) in diffParts"
              :key="i"
              :class="{
                'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 underline': part.added,
                'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 line-through': part.removed
              }"
            >{{ part.value }}</span>
          </p>
        </div>
      </template>
    </USlideover>
  </div>
</template>
