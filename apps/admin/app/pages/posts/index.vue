<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: posts } = await useFetch("/api/posts");

const visiblePosts = computed(() => posts.value?.filter((post) => post.status !== "trashed") ?? []);

const statusColor: Record<string, "neutral" | "success" | "warning" | "info" | "error"> = {
  draft: "neutral",
  published: "success",
  pending: "warning",
  scheduled: "info",
  trashed: "error"
};
</script>

<template>
  <div>
    <PageHeader title="Posts" :description="`${visiblePosts.length} post`">
      <template #actions>
        <UButton to="/trash" variant="ghost" color="neutral" icon="i-lucide-trash-2">Trash</UButton>
        <UButton to="/posts/new" icon="i-lucide-plus">Post Baru</UButton>
      </template>
    </PageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="py-3 px-4 font-medium text-slate-500">Judul</th>
              <th class="py-3 px-4 font-medium text-slate-500">Status</th>
              <th class="py-3 px-4 font-medium text-slate-500">Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="post in visiblePosts"
              :key="post.id"
              class="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 px-4">
                <NuxtLink :to="`/posts/${post.id}`" class="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
                  {{ post.title || "(Tanpa judul)" }}
                </NuxtLink>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="statusColor[post.status] ?? 'neutral'" variant="subtle">{{ post.status }}</UBadge>
              </td>
              <td class="py-3 px-4 text-slate-500">{{ new Date(post.updatedAt).toLocaleString() }}</td>
            </tr>
            <tr v-if="!visiblePosts.length">
              <td colspan="3" class="py-12 text-center text-slate-400">
                <UIcon name="i-lucide-file-text" class="size-8 mx-auto mb-2 text-slate-300" />
                Belum ada post.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
