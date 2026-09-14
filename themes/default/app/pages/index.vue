<script setup lang="ts">
const { data } = await useFetch("/api/posts", { query: { page: 1, limit: 6 } });
</script>

<template>
  <div>
    <section class="border-b border-slate-200 dark:border-slate-800">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h1 class="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
          Tulisan, cerita, dan ide-ide baru
        </h1>
        <p class="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Dibangun dengan SelfTaught CMS — cepat, modern, dan dirancang untuk kejelasan.
        </p>
        <NuxtLink
          to="/blog"
          class="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Jelajahi semua post
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </section>

    <section class="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="font-serif text-2xl font-semibold text-slate-900 dark:text-white">Post terbaru</h2>
        <NuxtLink to="/blog" class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
          Lihat semua →
        </NuxtLink>
      </div>

      <div v-if="data?.posts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        <PostCard v-for="post in data.posts" :key="post.id" :post="post" />
      </div>
      <p v-else class="text-slate-400 text-center py-12">Belum ada post yang dipublikasikan.</p>
    </section>
  </div>
</template>
