<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const { data: existingPages } = await useApiFetch<PageSummary[]>("/api/pages");

const title = ref("");
const slug = ref("");
const excerpt = ref("");
const parentId = ref<string | null>(null);
const menuOrder = ref(0);
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
    const page = await apiFetch<{ id: string }>("/api/pages", {
      method: "POST",
      body: {
        title: title.value,
        slug: slug.value,
        excerpt: excerpt.value || undefined,
        content: doc.value,
        parentId: parentId.value,
        menuOrder: menuOrder.value
      }
    });
    await navigateTo(`/pages/${page.id}`);
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan page.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/pages" class="font-semibold">Pages</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>Baru</span>
      </div>
      <UButton :loading="saving" @click="onSave">Simpan Draft</UButton>
    </header>

    <main class="p-6 max-w-3xl mx-auto space-y-4">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Judul">
            <UInput v-model="title" class="w-full" placeholder="Judul page" />
          </UFormField>
          <UFormField label="Slug">
            <UInput v-model="slug" class="w-full" placeholder="judul-page" />
          </UFormField>
          <UFormField label="Ringkasan (opsional)">
            <UTextarea v-model="excerpt" class="w-full" :rows="2" />
          </UFormField>
        </div>
      </UCard>

      <BlockEditor v-model="doc" />

      <UCard>
        <h2 class="font-medium mb-3">Hierarki</h2>
        <div class="space-y-4">
          <UFormField label="Parent Page (opsional)">
            <select v-model="parentId" class="w-full border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 bg-transparent text-sm">
              <option :value="null">(tidak ada — top-level)</option>
              <option v-for="p in existingPages" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </UFormField>
          <UFormField label="Urutan Menu">
            <UInput v-model.number="menuOrder" type="number" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </main>
  </div>
</template>
