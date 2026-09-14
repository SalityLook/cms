<script setup lang="ts">
interface CardPost {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  createdAt: string;
  featuredMediaUrl?: string | null;
  categories?: { id: string; slug: string; name: string }[];
}

defineProps<{ post: CardPost; basePath?: string }>();

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
</script>

<template>
  <article class="group">
    <NuxtLink :to="`${basePath ?? '/blog'}/${post.slug}`" class="block">
      <div class="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-4">
        <img
          v-if="post.featuredMediaUrl"
          :src="post.featuredMediaUrl"
          :alt="post.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        >
        <div v-else class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 6.75h18a.75.75 0 01.75.75v9a.75.75 0 01-.75.75H3a.75.75 0 01-.75-.75v-9A.75.75 0 013 6.75zM9 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
      </div>
    </NuxtLink>

    <NuxtLink
      v-if="post.categories?.[0]"
      :to="`/category/${post.categories[0].slug}`"
      class="inline-block text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-2 hover:underline"
    >
      {{ post.categories[0].name }}
    </NuxtLink>

    <h2 class="font-serif text-xl font-semibold leading-snug text-slate-900 dark:text-white mb-1.5">
      <NuxtLink :to="`${basePath ?? '/blog'}/${post.slug}`" class="hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
        {{ post.title || "(Tanpa judul)" }}
      </NuxtLink>
    </h2>

    <p v-if="post.excerpt" class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{{ post.excerpt }}</p>

    <time class="text-xs text-slate-400" :datetime="post.publishedAt ?? post.createdAt">
      {{ formatDate(post.publishedAt ?? post.createdAt) }}
    </time>
  </article>
</template>
