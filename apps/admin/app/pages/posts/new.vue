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
  <div>
    <PageHeader title="Post Baru">
      <template #actions>
        <UButton to="/posts" variant="ghost" color="neutral">Batal</UButton>
        <UButton :loading="saving" icon="i-lucide-check" @click="onSave">Simpan Draft</UButton>
      </template>
    </PageHeader>

    <div class="max-w-3xl space-y-4">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Judul">
            <UInput v-model="title" class="w-full" placeholder="Judul post" size="lg" />
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

      <UAlert v-if="error" color="error" variant="subtle" :title="error" />
    </div>
  </div>
</template>
