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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="font-semibold">SelfTaught CMS</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>Media</span>
      </div>
      <label>
        <UButton :loading="uploading" as="span">Upload</UButton>
        <input type="file" class="hidden" accept="image/*" @change="onFileChange" >
      </label>
    </header>

    <main class="p-6">
      <p v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        <div v-for="item in items" :key="item.id" class="group relative border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
          <img :src="item.url" :alt="item.altText ?? ''" class="w-full h-24 object-cover" >
          <button
            class="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
            @click="onDelete(item.id)"
          >
            Hapus
          </button>
        </div>
        <p v-if="!items?.length" class="col-span-full text-gray-400">Belum ada media.</p>
      </div>
    </main>
  </div>
</template>
