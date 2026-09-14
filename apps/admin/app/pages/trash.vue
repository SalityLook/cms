<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data, refresh } = await useApiFetch<Paginated<PostSummary>>("/api/posts", { query: { status: "trashed" } });
const posts = computed(() => data.value?.items ?? []);

async function onUntrash(id: string) {
  await apiFetch(`/api/posts/${id}/untrash`, { method: "POST" });
  await refresh();
}

async function onDelete(id: string) {
  await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div>
    <PageHeader title="Trash" description="Post yang dipindahkan ke trash — pulihkan atau hapus permanen." />

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <ul class="divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="post in posts" :key="post.id" class="py-3 px-4 flex items-center justify-between gap-4">
          <span class="font-medium text-slate-900 dark:text-white truncate">{{ post.title || "(Tanpa judul)" }}</span>
          <div class="flex items-center gap-2 shrink-0">
            <UButton size="xs" variant="outline" icon="i-lucide-rotate-ccw" @click="onUntrash(post.id)">Pulihkan</UButton>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(post.id)">
              Hapus Permanen
            </UButton>
          </div>
        </li>
        <li v-if="!posts?.length" class="py-12 text-center text-slate-400">
          <UIcon name="i-lucide-trash-2" class="size-8 mx-auto mb-2 text-slate-300" />
          Trash kosong.
        </li>
      </ul>
    </UCard>
  </div>
</template>
