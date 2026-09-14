<script setup lang="ts">
const route = useRoute();
const page = computed(() => {
  const raw = Number(route.query.page ?? 1);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
});

const { data } = await useFetch("/api/posts", { query: { page } });
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <h1 class="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-10">Blog</h1>

    <div v-if="data?.posts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
      <PostCard v-for="post in data.posts" :key="post.id" :post="post" />
    </div>
    <p v-else class="text-slate-400 text-center py-16">Belum ada post yang dipublikasikan.</p>

    <nav v-if="data && data.totalPages > 1" class="flex items-center justify-between mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
      <NuxtLink
        v-if="page > 1"
        :to="{ path: '/blog', query: { page: page - 1 } }"
        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        ← Sebelumnya
      </NuxtLink>
      <span v-else />
      <span class="text-sm text-slate-400">Halaman {{ page }} dari {{ data.totalPages }}</span>
      <NuxtLink
        v-if="page < data.totalPages"
        :to="{ path: '/blog', query: { page: page + 1 } }"
        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        Berikutnya →
      </NuxtLink>
      <span v-else />
    </nav>
  </div>
</template>
