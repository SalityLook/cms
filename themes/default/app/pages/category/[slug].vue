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
    <nav v-if="data?.ancestors.length" class="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
      <NuxtLink to="/blog" class="hover:text-slate-600 dark:hover:text-slate-300">Blog</NuxtLink>
      <template v-for="ancestor in data.ancestors" :key="ancestor.id">
        <span aria-hidden="true">/</span>
        <NuxtLink :to="`/category/${ancestor.slug}`" class="hover:text-slate-600 dark:hover:text-slate-300">
          {{ ancestor.name }}
        </NuxtLink>
      </template>
      <span aria-hidden="true">/</span>
      <span class="text-slate-600 dark:text-slate-300">{{ data.term.name }}</span>
    </nav>

    <p class="text-sm font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide mb-2">Kategori</p>
    <h1 class="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-4">
      {{ data?.term.name }}
    </h1>

    <div v-if="data?.children.length" class="flex flex-wrap gap-2 mb-10">
      <NuxtLink
        v-for="child in data.children"
        :key="child.id"
        :to="`/category/${child.slug}`"
        class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        {{ child.name }}
      </NuxtLink>
    </div>

    <div v-if="data?.posts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mt-10">
      <PostCard v-for="post in data.posts" :key="post.id" :post="post" />
    </div>
    <p v-else class="text-slate-400 text-center py-16">Belum ada post di kategori ini.</p>
  </div>
</template>
