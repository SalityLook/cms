<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const title = ref("");
const slug = ref("");
const excerpt = ref("");
const doc = ref<ContentDocument>({ version: 1, type: "doc", content: [] });
const saving = ref(false);
const error = ref("");

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

watch(title, (value) => {
  if (!slug.value) {
    slug.value = slugify(value);
  }
});

async function onSave() {
  error.value = "";
  saving.value = true;
  try {
    const post = await $fetch("/api/posts", {
      method: "POST",
      body: {
        title: title.value,
        slug: slug.value,
        excerpt: excerpt.value || undefined,
        content: doc.value
      }
    });
    await navigateTo(`/posts/${post.id}`);
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan post.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/posts" class="font-semibold">Posts</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>Baru</span>
      </div>
      <UButton :loading="saving" @click="onSave">Simpan Draft</UButton>
    </header>

    <main class="p-6 max-w-3xl mx-auto space-y-4">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Judul">
            <UInput v-model="title" class="w-full" placeholder="Judul post" />
          </UFormField>
          <UFormField label="Slug">
            <UInput v-model="slug" class="w-full" placeholder="judul-post" />
          </UFormField>
          <UFormField label="Ringkasan (opsional)">
            <UTextarea v-model="excerpt" class="w-full" :rows="2" />
          </UFormField>
        </div>
      </UCard>

      <BlockEditor v-model="doc" />

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </main>
  </div>
</template>
