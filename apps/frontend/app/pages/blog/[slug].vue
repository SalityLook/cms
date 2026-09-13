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
const categories = computed(() => post.value?.terms.filter((term) => term.taxonomy === "category") ?? []);
const tags = computed(() => post.value?.terms.filter((term) => term.taxonomy === "tag") ?? []);

useSeoMeta({
  title: post.value.seo.title,
  description: post.value.seo.description ?? undefined,
  ogTitle: post.value.seo.title,
  ogDescription: post.value.seo.description ?? undefined,
  ogImage: post.value.seo.ogImageUrl ?? undefined,
  robots: post.value.seo.noindex ? "noindex, nofollow" : undefined
});

useHead({
  link: post.value.seo.canonicalUrl ? [{ rel: "canonical", href: post.value.seo.canonicalUrl }] : [],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(post.value.jsonLd)
    }
  ]
});
</script>

<template>
  <article class="max-w-2xl mx-auto px-4 py-12 prose dark:prose-invert">
    <img v-if="post?.featuredMediaUrl" :src="post.featuredMediaUrl" alt="" class="rounded-md" >
    <h1>{{ post?.title }}</h1>

    <div v-if="categories.length" class="not-prose flex gap-2 text-sm mb-2">
      <NuxtLink v-for="cat in categories" :key="cat.id" :to="`/category/${cat.slug}`" class="text-primary hover:underline">
        {{ cat.name }}
      </NuxtLink>
    </div>

    <BlockRenderer v-for="(node, i) in doc.content" :key="i" :node="node" />

    <div v-if="tags.length" class="not-prose flex gap-2 text-sm mt-6">
      <NuxtLink v-for="tag in tags" :key="tag.id" :to="`/tag/${tag.slug}`" class="text-gray-500 hover:underline">
        #{{ tag.name }}
      </NuxtLink>
    </div>
  </article>
</template>
