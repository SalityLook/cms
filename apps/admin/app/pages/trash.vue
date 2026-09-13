<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: posts, refresh } = await useApiFetch<PostSummary[]>("/api/posts", { query: { status: "trashed" } });

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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-3">
      <NuxtLink to="/posts" class="font-semibold">Posts</NuxtLink>
      <span class="text-gray-400">/</span>
      <span>Trash</span>
    </header>

    <main class="p-6">
      <UCard>
        <ul class="divide-y divide-gray-100 dark:divide-gray-900">
          <li v-for="post in posts" :key="post.id" class="py-2 flex items-center justify-between">
            <span>{{ post.title }}</span>
            <div class="flex items-center gap-2">
              <UButton size="xs" variant="outline" @click="onUntrash(post.id)">Pulihkan</UButton>
              <UButton size="xs" color="error" variant="ghost" @click="onDelete(post.id)">Hapus Permanen</UButton>
            </div>
          </li>
          <li v-if="!posts?.length" class="py-6 text-center text-gray-400">Trash kosong.</li>
        </ul>
      </UCard>
    </main>
  </div>
</template>
