<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useFetch(`/api/tag/${slug}`);

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: "Tag not found" });
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-12">
    <h1 class="text-2xl font-semibold mb-6">Tag: {{ data?.term.name }}</h1>
    <ul class="space-y-4">
      <li v-for="post in data?.posts" :key="post.id">
        <NuxtLink :to="`/blog/${post.slug}`" class="text-lg font-medium hover:underline">{{ post.title }}</NuxtLink>
      </li>
      <li v-if="!data?.posts.length" class="text-gray-400">Belum ada post dengan tag ini.</li>
    </ul>
  </div>
</template>
