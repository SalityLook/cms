<script setup lang="ts">
const { data: posts } = await useFetch("/api/posts");
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-12">
    <h1 class="text-2xl font-semibold mb-6">Blog</h1>
    <ul class="space-y-4">
      <li v-for="post in posts" :key="post.id">
        <NuxtLink :to="`/blog/${post.slug}`" class="text-lg font-medium hover:underline">{{ post.title }}</NuxtLink>
        <p v-if="post.excerpt" class="text-gray-500">{{ post.excerpt }}</p>
      </li>
      <li v-if="!posts?.length" class="text-gray-400">Belum ada post yang dipublikasikan.</li>
    </ul>
  </div>
</template>
