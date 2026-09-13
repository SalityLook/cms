<script setup lang="ts">
const props = defineProps<{ taxonomy: string; label: string }>();

const { data: terms, refresh } = await useFetch(`/api/taxonomy/${props.taxonomy}`);
const name = ref("");
const slug = ref("");
const error = ref("");
const saving = ref(false);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

watch(name, (value) => {
  if (!slug.value) slug.value = slugify(value);
});

async function onCreate() {
  error.value = "";
  saving.value = true;
  try {
    await $fetch(`/api/taxonomy/${props.taxonomy}`, {
      method: "POST",
      body: { name: name.value, slug: slug.value }
    });
    name.value = "";
    slug.value = "";
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  } finally {
    saving.value = false;
  }
}

async function onDelete(id: string) {
  await $fetch(`/api/taxonomy/${props.taxonomy}/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-3">
      <NuxtLink to="/" class="font-semibold">SelfTaught CMS</NuxtLink>
      <span class="text-gray-400">/</span>
      <span>{{ label }}</span>
    </header>

    <main class="p-6 max-w-2xl mx-auto space-y-4">
      <UCard>
        <form class="flex items-end gap-3" @submit.prevent="onCreate">
          <UFormField label="Nama" class="flex-1">
            <UInput v-model="name" class="w-full" />
          </UFormField>
          <UFormField label="Slug" class="flex-1">
            <UInput v-model="slug" class="w-full" />
          </UFormField>
          <UButton type="submit" :loading="saving">Tambah</UButton>
        </form>
        <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
      </UCard>

      <UCard>
        <ul class="divide-y divide-gray-100 dark:divide-gray-900">
          <li v-for="term in terms" :key="term.id" class="py-2 flex items-center justify-between">
            <span>{{ term.name }} <span class="text-gray-400 text-sm">/{{ term.slug }}</span></span>
            <UButton size="xs" color="error" variant="ghost" @click="onDelete(term.id)">Hapus</UButton>
          </li>
          <li v-if="!terms?.length" class="py-4 text-center text-gray-400">Belum ada {{ label.toLowerCase() }}.</li>
        </ul>
      </UCard>
    </main>
  </div>
</template>
