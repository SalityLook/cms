<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";
import { BlockRenderer } from "@selftaught/blocks";

const route = useRoute();
const slug = route.params.slug as string;

const { data: post } = await useFetch(`/api/posts/${slug}`);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" });
}

const doc = computed(() => post.value!.content as ContentDocument);

useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt ?? undefined
});
</script>

<template>
  <article class="max-w-2xl mx-auto px-4 py-12 prose dark:prose-invert">
    <h1>{{ post?.title }}</h1>
    <BlockRenderer v-for="(node, i) in doc.content" :key="i" :node="node" />
  </article>
</template>
