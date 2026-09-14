<script setup lang="ts">
const props = defineProps<{ taxonomy: string; label: string }>();

const { data: terms, refresh } = await useApiFetch<TermSummary[]>(`/api/taxonomy/${props.taxonomy}`);
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
    await apiFetch(`/api/taxonomy/${props.taxonomy}`, {
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
  await apiFetch(`/api/taxonomy/${props.taxonomy}/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div>
    <PageHeader :title="label" :description="`${terms?.length ?? 0} ${label.toLowerCase()}`" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard class="lg:col-span-1 h-fit">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Tambah {{ label.toLowerCase() }}</h2>
        </template>
        <form class="space-y-3" @submit.prevent="onCreate">
          <UFormField label="Nama">
            <UInput v-model="name" class="w-full" placeholder="mis. Teknologi" />
          </UFormField>
          <UFormField label="Slug">
            <UInput v-model="slug" class="w-full" placeholder="teknologi" />
          </UFormField>
          <UButton type="submit" block :loading="saving">Tambah</UButton>
          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        </form>
      </UCard>

      <UCard class="lg:col-span-2" :ui="{ body: 'p-0 sm:p-0' }">
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="term in terms" :key="term.id" class="py-3 px-4 flex items-center justify-between">
            <div>
              <span class="font-medium text-slate-900 dark:text-white">{{ term.name }}</span>
              <span class="text-slate-400 text-sm ml-2">/{{ term.slug }}</span>
            </div>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(term.id)" />
          </li>
          <li v-if="!terms?.length" class="py-12 text-center text-slate-400">
            Belum ada {{ label.toLowerCase() }}.
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
