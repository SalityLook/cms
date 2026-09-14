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
  <article>
    <header class="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 text-center">
      <h1 class="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
        {{ page?.title }}
      </h1>
    </header>

    <div v-if="page?.featuredMediaUrl" class="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
      <img :src="page.featuredMediaUrl" :alt="page.title" class="w-full rounded-2xl object-cover aspect-[16/9]" >
    </div>

    <div class="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
      <div class="prose prose-slate dark:prose-invert prose-lg max-w-none">
        <BlockRenderer v-for="(node, i) in doc.content" :key="i" :node="node" />
      </div>
    </div>
  </article>
</template>
