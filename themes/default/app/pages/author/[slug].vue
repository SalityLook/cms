<script setup lang="ts">
interface AuthorPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
}

interface AuthorResponse {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  posts: AuthorPost[];
}

const route = useRoute();
const { data: author } = await useFetch<AuthorResponse>(`/api/author/${route.params.slug}`);

if (!author.value) {
  throw createError({ statusCode: 404, statusMessage: "Author not found" });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16 sm:py-24">
    <div class="flex items-center gap-4 mb-10">
      <img
        v-if="author?.avatarUrl"
        :src="author.avatarUrl"
        :alt="author.displayName"
        class="size-16 rounded-full object-cover"
      >
      <div v-else class="size-16 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 font-serif text-2xl">
        {{ author?.displayName?.[0] }}
      </div>
      <div>
        <h1 class="font-serif text-2xl font-semibold text-slate-900 dark:text-white">{{ author?.displayName }}</h1>
        <p v-if="author?.bio" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ author.bio }}</p>
      </div>
    </div>

    <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Post</h2>
    <ul v-if="author?.posts.length" class="space-y-6">
      <li v-for="post in author.posts" :key="post.id">
        <NuxtLink :to="`/blog/${post.slug}`" class="block group">
          <h3 class="font-serif text-lg font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {{ post.title }}
          </h3>
          <p v-if="post.excerpt" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ post.excerpt }}</p>
          <time v-if="post.publishedAt" class="text-xs text-slate-400">{{ formatDate(post.publishedAt) }}</time>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="text-slate-400">Belum ada post yang dipublikasikan.</p>
  </div>
</template>
