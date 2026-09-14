<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";

definePageMeta({ middleware: "auth" });

const { data: existingPagesData } = await useApiFetch<Paginated<PageSummary>>("/api/pages");
const existingPages = computed(() => existingPagesData.value?.items ?? []);

const title = ref("");
const slug = ref("");
const excerpt = ref("");
const parentId = ref<string | null>(null);
const menuOrder = ref(0);
const doc = ref<ContentDocument>({ version: 1, type: "doc", content: [] });
const saving = ref(false);
const error = ref("");

const parentOptions = computed(() => [
  { label: "(tidak ada — top-level)", value: null },
  ...(existingPages.value ?? []).map((p) => ({ label: p.title || "(Tanpa judul)", value: p.id }))
]);

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
  <div>
    <PageHeader title="Page Baru">
      <template #actions>
        <UButton to="/pages" variant="ghost" color="neutral">Batal</UButton>
        <UButton :loading="saving" icon="i-lucide-check" @click="onSave">Simpan Draft</UButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4 min-w-0">
        <UCard>
          <div class="space-y-4">
            <UFormField label="Judul">
              <UInput v-model="title" class="w-full" placeholder="Judul page" size="lg" />
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

        <UAlert v-if="error" color="error" variant="subtle" :title="error" />
      </div>

      <div class="space-y-4 min-w-0">
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
      </div>
    </div>
  </div>
</template>
