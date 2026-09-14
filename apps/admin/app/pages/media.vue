<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { search, page, selectedIds, clearSelection } = useListQuery();

const queryParams = reactive({ search: search.value || undefined, page: page.value });

const { data, refresh } = await useApiFetch<Paginated<MediaItem>>("/api/media", { query: queryParams });

watch([search, page], () => {
  queryParams.search = search.value || undefined;
  queryParams.page = page.value;
  refresh();
});

const uploading = ref(false);
const error = ref("");

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  error.value = "";
  uploading.value = true;
  try {
    const form = new FormData();
    form.append("file", file);
    await apiFetch("/api/media", { method: "POST", body: form });
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal upload.";
  } finally {
    uploading.value = false;
    input.value = "";
  }
}

async function onDelete(id: string) {
  await apiFetch(`/api/media/${id}`, { method: "DELETE" });
  await refresh();
}

function toggleOne(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

async function onBulkDelete() {
  await apiFetch("/api/media/bulk", { method: "POST", body: { ids: [...selectedIds.value], action: "delete" } });
  clearSelection();
  await refresh();
}
</script>

<template>
  <div>
    <PageHeader title="Media Library" :description="`${data?.total ?? 0} file`">
      <template #actions>
        <label>
          <UButton :loading="uploading" as="span" icon="i-lucide-upload">Upload</UButton>
          <input type="file" class="hidden" accept="image/*" @change="onFileChange" >
        </label>
      </template>
    </PageHeader>

    <UAlert v-if="error" color="error" variant="subtle" :title="error" class="mb-4" />

    <div class="flex items-center gap-2 mb-4">
      <UInput v-model="search" placeholder="Cari nama file..." icon="i-lucide-search" class="flex-1 max-w-xs" />
    </div>

    <div v-if="selectedIds.size" class="flex items-center gap-2 mb-4 rounded-lg bg-brand-50 dark:bg-brand-950 px-4 py-2.5">
      <span class="text-sm font-medium text-brand-700 dark:text-brand-300">{{ selectedIds.size }} dipilih</span>
      <UButton size="xs" color="error" variant="soft" icon="i-lucide-trash-2" @click="onBulkDelete">Hapus</UButton>
      <UButton size="xs" variant="ghost" color="neutral" @click="clearSelection">Batal</UButton>
    </div>

    <div v-if="data?.items.length" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
      <div
        v-for="item in data.items"
        :key="item.id"
        class="group relative aspect-square border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900"
      >
        <img :src="item.url" :alt="item.altText ?? ''" class="w-full h-full object-cover" >
        <input
          type="checkbox"
          class="absolute top-2 left-2 rounded size-4"
          :checked="selectedIds.has(item.id)"
          @change="toggleOne(item.id)"
        >
        <button
          class="absolute inset-0 bg-slate-950/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity"
          @click="onDelete(item.id)"
        >
          <UIcon name="i-lucide-trash-2" class="size-4" />
          Hapus
        </button>
      </div>
    </div>
    <div v-else class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center">
      <UIcon name="i-lucide-image" class="size-8 mx-auto mb-2 text-slate-300" />
      <p class="text-slate-400 text-sm">Belum ada media. Upload gambar pertama Anda.</p>
    </div>

    <nav v-if="data && data.totalPages > 1" class="flex items-center justify-between mt-6">
      <UButton :disabled="page <= 1" variant="ghost" color="neutral" size="sm" @click="page = page - 1">← Sebelumnya</UButton>
      <span class="text-sm text-slate-400">Halaman {{ page }} dari {{ data.totalPages }}</span>
      <UButton :disabled="page >= data.totalPages" variant="ghost" color="neutral" size="sm" @click="page = page + 1">Berikutnya →</UButton>
    </nav>
  </div>
</template>
