<script setup lang="ts">
const { data } = await useFetch("/api/posts", { query: { page: 1, limit: 5 } });
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-12">
    <h1 class="text-2xl font-semibold mb-6">SelfTaught CMS</h1>

    <ul class="space-y-4">
      <li v-for="post in data?.posts" :key="post.id">
        <NuxtLink :to="`/blog/${post.slug}`" class="text-lg font-medium hover:underline">{{ post.title }}</NuxtLink>
        <p v-if="post.excerpt" class="text-gray-500">{{ post.excerpt }}</p>
      </li>
      <li v-if="!data?.posts.length" class="text-gray-400">Belum ada post yang dipublikasikan.</li>
    </ul>

    <NuxtLink to="/blog" class="inline-block mt-6 hover:underline">Lihat semua post →</NuxtLink>
  </div>
</template>
