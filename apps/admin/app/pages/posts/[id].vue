<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const id = route.params.id as string;

const { data: post, refresh } = await useFetch(`/api/posts/${id}`);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" });
}

const { data: mediaItems } = await useFetch("/api/media");
const { data: categories } = await useFetch("/api/taxonomy/category");
const { data: tags } = await useFetch("/api/taxonomy/tag");

const title = ref(post.value.title);
const slug = ref(post.value.slug);
const excerpt = ref(post.value.excerpt ?? "");
const doc = ref<ContentDocument>(post.value.content as ContentDocument);
const featuredMediaId = ref<string | null>(post.value.featuredMediaId);
const selectedTermIds = ref<string[]>(post.value.terms.map((term) => term.id));
const saving = ref(false);
const error = ref("");

function toggleTerm(termId: string) {
  const idx = selectedTermIds.value.indexOf(termId);
  if (idx === -1) {
    selectedTermIds.value.push(termId);
  } else {
    selectedTermIds.value.splice(idx, 1);
  }
}

async function onSave() {
  error.value = "";
  saving.value = true;
  try {
    await $fetch(`/api/posts/${id}`, {
      method: "PATCH",
      body: {
        title: title.value,
        slug: slug.value,
        excerpt: excerpt.value || undefined,
        content: doc.value,
        featuredMediaId: featuredMediaId.value,
        termIds: selectedTermIds.value
      }
    });
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  } finally {
    saving.value = false;
  }
}

async function onPublish() {
  await $fetch(`/api/posts/${id}/publish`, { method: "POST" });
  await refresh();
}

async function onUnpublish() {
  await $fetch(`/api/posts/${id}/unpublish`, { method: "POST" });
  await refresh();
}

async function onDelete() {
  await $fetch(`/api/posts/${id}`, { method: "DELETE" });
  await navigateTo("/posts");
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/posts" class="font-semibold">Posts</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>{{ post?.title }}</span>
      </div>
      <div class="flex items-center gap-2">
        <UButton variant="ghost" :loading="saving" @click="onSave">Simpan</UButton>
        <UButton v-if="post?.status !== 'published'" color="success" @click="onPublish">Publish</UButton>
        <UButton v-else color="neutral" variant="outline" @click="onUnpublish">Batalkan Publish</UButton>
        <UButton color="error" variant="ghost" @click="onDelete">Hapus</UButton>
      </div>
    </header>

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
            <img :src="item.url" :alt="item.altText ?? ''" class="w-16 h-16 object-cover" >
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

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </main>
  </div>
</template>
