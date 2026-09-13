<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";
import { BlockRenderer } from "@selftaught/blocks";

const route = useRoute();
const slug = route.params.slug as string;

const { data: page } = await useFetch(`/api/pages/${slug}`);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

const doc = computed(() => page.value!.content as ContentDocument);

useSeoMeta({
  title: page.value.seo.title,
  description: page.value.seo.description ?? undefined,
  ogTitle: page.value.seo.title,
  ogDescription: page.value.seo.description ?? undefined,
  ogImage: page.value.seo.ogImageUrl ?? undefined,
  robots: page.value.seo.noindex ? "noindex, nofollow" : undefined
});

useHead({
  link: page.value.seo.canonicalUrl ? [{ rel: "canonical", href: page.value.seo.canonicalUrl }] : [],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(page.value.jsonLd)
    }
  ]
});
</script>

<template>
  <article class="max-w-2xl mx-auto px-4 py-12 prose dark:prose-invert">
    <img v-if="page?.featuredMediaUrl" :src="page.featuredMediaUrl" alt="" class="rounded-md">
    <h1>{{ page?.title }}</h1>
    <BlockRenderer v-for="(node, i) in doc.content" :key="i" :node="node" />
  </article>
</template>
