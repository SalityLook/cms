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
const publishedLabel = computed(() => {
  const date = post.value?.publishedAt ?? post.value?.createdAt;
  return date ? new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
});

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
  <article>
    <header class="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 text-center">
      <div v-if="categories.length" class="flex justify-center gap-2 mb-4">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
          class="text-xs font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide hover:underline"
        >
          {{ cat.name }}
        </NuxtLink>
      </div>
      <h1 class="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
        {{ post?.title }}
      </h1>
      <p v-if="post?.excerpt" class="mt-4 text-lg text-slate-500 dark:text-slate-400">{{ post.excerpt }}</p>
      <time class="mt-6 block text-sm text-slate-400">{{ publishedLabel }}</time>
    </header>

    <div v-if="post?.featuredMediaUrl" class="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
      <img :src="post.featuredMediaUrl" :alt="post.title" class="w-full rounded-2xl object-cover aspect-[16/9]" >
    </div>

    <div class="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
      <div class="prose prose-slate dark:prose-invert prose-lg max-w-none">
        <BlockRenderer v-for="(node, i) in doc.content" :key="i" :node="node" />
      </div>

      <div v-if="tags.length" class="flex flex-wrap gap-2 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tag/${tag.slug}`"
          class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          #{{ tag.name }}
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
