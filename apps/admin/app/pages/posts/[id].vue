<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const id = route.params.id as string;

const { data: post, refresh } = await useFetch(`/api/posts/${id}`);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" });
}

const title = ref(post.value.title);
const slug = ref(post.value.slug);
const excerpt = ref(post.value.excerpt ?? "");
const doc = ref<ContentDocument>(post.value.content as ContentDocument);
const saving = ref(false);
const error = ref("");

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
        content: doc.value
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

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </main>
  </div>
</template>
