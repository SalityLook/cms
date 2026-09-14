<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useFetch(`/api/category/${slug}`);

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: "Category not found" });
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <p class="text-sm font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide mb-2">Kategori</p>
    <h1 class="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-10">
      {{ data?.term.name }}
    </h1>

    <div v-if="data?.posts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
      <PostCard v-for="post in data.posts" :key="post.id" :post="post" />
    </div>
    <p v-else class="text-slate-400 text-center py-16">Belum ada post di kategori ini.</p>
  </div>
</template>
