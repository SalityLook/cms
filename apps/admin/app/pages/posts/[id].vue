<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const id = route.params.id as string;

const { data: post, refresh } = await useApiFetch<PostDetail>(`/api/posts/${id}`);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" });
}

const { data: mediaItems } = await useApiFetch<MediaItem[]>("/api/media");
const { data: categories } = await useApiFetch<TermSummary[]>("/api/taxonomy/category");
const { data: tags } = await useApiFetch<TermSummary[]>("/api/taxonomy/tag");
const { data: revisions, refresh: refreshRevisions } = await useApiFetch<RevisionSummary[]>(`/api/posts/${id}/revisions`);
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
}

async function onDelete() {
  await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
  await navigateTo("/posts");
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-3">
        <NuxtLink to="/posts" class="font-semibold">Posts</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>{{ post?.title }}</span>
        <UBadge variant="subtle">{{ post?.status }}</UBadge>
      </div>

      <div v-if="post?.status === 'trashed'" class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" @click="onUntrash">Pulihkan</UButton>
        <UButton color="error" @click="onDelete">Hapus Permanen</UButton>
      </div>
      <div v-else class="flex items-center gap-2 flex-wrap">
        <UButton variant="ghost" :loading="saving" @click="onSave">Simpan</UButton>

        <UButton v-if="post?.status === 'draft'" color="neutral" variant="outline" @click="onSubmit">Ajukan Review</UButton>
        <UButton v-if="post?.status === 'pending'" color="neutral" variant="outline" @click="onUnpublish">Kembalikan ke Draft</UButton>
        <UButton v-if="post?.status === 'scheduled'" color="neutral" variant="outline" @click="onUnpublish">Batalkan Jadwal</UButton>

        <UButton v-if="post?.status !== 'published'" color="success" @click="onPublish">
          {{ post?.status === "scheduled" ? "Publish Sekarang" : "Publish" }}
        </UButton>
        <UButton v-else color="neutral" variant="outline" @click="onUnpublish">Batalkan Publish</UButton>

        <UButton
          v-if="post?.status === 'draft' || post?.status === 'pending'"
          color="neutral"
          variant="outline"
          @click="showScheduleInput = !showScheduleInput"
        >
          Jadwalkan
        </UButton>

        <UButton color="error" variant="ghost" @click="onTrash">Pindah ke Trash</UButton>
      </div>
    </header>

    <div v-if="showScheduleInput" class="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-2">
      <input v-model="scheduledAt" type="datetime-local" class="border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 bg-transparent" >
      <UButton size="sm" @click="onConfirmSchedule">Konfirmasi Jadwal</UButton>
    </div>

    <main class="p-6 max-w-3xl mx-auto space-y-4">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Judul">
            <UInput v-model="title" class="w-full" />
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
        <h2 class="font-medium mb-3">Gambar Unggulan</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in mediaItems"
            :key="item.id"
            type="button"
            class="border-2 rounded-md overflow-hidden"
            :class="featuredMediaId === item.id ? 'border-primary' : 'border-transparent'"
            @click="featuredMediaId = featuredMediaId === item.id ? null : item.id"
          >
            <img :src="item.url" :alt="item.altText ?? ''" class="w-16 h-16 object-cover">
          </button>
          <p v-if="!mediaItems?.length" class="text-gray-400 text-sm">
            Belum ada media. Upload dulu di halaman <NuxtLink to="/media" class="underline">Media</NuxtLink>.
          </p>
        </div>
      </UCard>

      <UCard>
        <h2 class="font-medium mb-3">Categories</h2>
        <div class="flex flex-wrap gap-2 mb-4">
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
          <p v-if="!categories?.length" class="text-gray-400 text-sm">
            Belum ada category. Buat di halaman <NuxtLink to="/categories" class="underline">Categories</NuxtLink>.
          </p>
        </div>

        <h2 class="font-medium mb-3">Tags</h2>
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
          <p v-if="!tags?.length" class="text-gray-400 text-sm">
            Belum ada tag. Buat di halaman <NuxtLink to="/tags" class="underline">Tags</NuxtLink>.
          </p>
        </div>
      </UCard>

      <UCard>
        <h2 class="font-medium mb-3">SEO</h2>
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
            <p class="text-sm font-medium mb-2">OG Image (opsional, fallback ke Gambar Unggulan)</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="item in mediaItems"
                :key="item.id"
                type="button"
                class="border-2 rounded-md overflow-hidden"
                :class="seoOgImageId === item.id ? 'border-primary' : 'border-transparent'"
                @click="seoOgImageId = seoOgImageId === item.id ? null : item.id"
              >
                <img :src="item.url" :alt="item.altText ?? ''" class="w-12 h-12 object-cover">
              </button>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="seoNoindex" type="checkbox">
            Noindex (sembunyikan dari mesin pencari)
          </label>
        </div>
      </UCard>

      <UCard>
        <h2 class="font-medium mb-3">Revisions</h2>
        <ul class="divide-y divide-gray-100 dark:divide-gray-900">
          <li v-for="rev in revisions" :key="rev.id" class="py-2 flex items-center justify-between">
            <span class="text-sm">{{ rev.title }} — {{ new Date(rev.createdAt).toLocaleString() }}</span>
            <UButton size="xs" variant="outline" @click="onRestoreRevision(rev.id)">Pulihkan versi ini</UButton>
          </li>
          <li v-if="!revisions?.length" class="py-4 text-center text-gray-400 text-sm">Belum ada revisi tersimpan.</li>
        </ul>
      </UCard>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </main>
  </div>
</template>
