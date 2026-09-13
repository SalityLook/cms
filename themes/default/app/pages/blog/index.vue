<script setup lang="ts">
const route = useRoute();
const page = computed(() => {
  const raw = Number(route.query.page ?? 1);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
});

const { data } = await useFetch("/api/posts", { query: { page } });
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-12">
    <h1 class="text-2xl font-semibold mb-6">Blog</h1>
    <ul class="space-y-4">
      <li v-for="post in data?.posts" :key="post.id">
        <NuxtLink :to="`/blog/${post.slug}`" class="text-lg font-medium hover:underline">{{ post.title }}</NuxtLink>
        <p v-if="post.excerpt" class="text-gray-500">{{ post.excerpt }}</p>
      </li>
      <li v-if="!data?.posts.length" class="text-gray-400">Belum ada post yang dipublikasikan.</li>
    </ul>

    <nav v-if="data && data.totalPages > 1" class="flex items-center justify-between mt-8 text-sm">
      <NuxtLink
        v-if="page > 1"
        :to="{ path: '/blog', query: { page: page - 1 } }"
        class="hover:underline"
      >
        ← Sebelumnya
      </NuxtLink>
      <span v-else />
      <span class="text-gray-400">Halaman {{ page }} / {{ data.totalPages }}</span>
      <NuxtLink
        v-if="page < data.totalPages"
        :to="{ path: '/blog', query: { page: page + 1 } }"
        class="hover:underline"
      >
        Berikutnya →
      </NuxtLink>
      <span v-else />
    </nav>
  </div>
</template>
