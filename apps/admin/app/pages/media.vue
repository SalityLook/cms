<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: items, refresh } = await useApiFetch<MediaItem[]>("/api/media");
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
</script>

<template>
  <div>
    <PageHeader title="Media Library" :description="`${items?.length ?? 0} file`">
      <template #actions>
        <label>
          <UButton :loading="uploading" as="span" icon="i-lucide-upload">Upload</UButton>
          <input type="file" class="hidden" accept="image/*" @change="onFileChange" >
        </label>
      </template>
    </PageHeader>

    <UAlert v-if="error" color="error" variant="subtle" :title="error" class="mb-4" />

    <div v-if="items?.length" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative aspect-square border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900"
      >
        <img :src="item.url" :alt="item.altText ?? ''" class="w-full h-full object-cover" >
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
  </div>
</template>
