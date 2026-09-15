<script setup lang="ts">
interface SearchResultRow {
  id: string;
  type: string;
  slug: string;
  title: string;
  snippet: string;
}

const route = useRoute();
const q = computed(() => (typeof route.query.q === "string" ? route.query.q : ""));
const page = computed(() => {
  const raw = Number(route.query.page ?? 1);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
});

const { data } = await useFetch<{ results: SearchResultRow[]; page: number; totalPages: number; total: number }>(
  "/api/search",
  { query: { q, page } }
);

function urlFor(result: SearchResultRow) {
  return result.type === "post" ? `/blog/${result.slug}` : `/${result.slug}`;
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <h1 class="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-6">Cari</h1>

    <form method="get" action="/search" class="mb-10">
      <div class="flex gap-2">
        <input
          type="search"
          name="q"
          :value="q"
          placeholder="Cari artikel atau halaman..."
          class="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Cari
        </button>
      </div>
    </form>

    <p v-if="!q" class="text-slate-400">Masukkan kata kunci untuk mulai mencari.</p>
    <p v-else-if="!data?.results.length" class="text-slate-400">
      Tidak ada hasil untuk "<span class="font-medium text-slate-600 dark:text-slate-300">{{ q }}</span>".
    </p>

    <ul v-else class="space-y-8">
      <li v-for="result in data.results" :key="result.id">
        <NuxtLink :to="urlFor(result)" class="block group">
          <span class="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-medium">
            {{ result.type === "post" ? "Post" : "Page" }}
          </span>
          <h2 class="font-serif text-xl font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {{ result.title }}
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" v-html="result.snippet" />
        </NuxtLink>
      </li>
    </ul>

    <nav v-if="data && data.totalPages > 1" class="flex items-center justify-between mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
      <NuxtLink
        v-if="page > 1"
        :to="{ path: '/search', query: { q, page: page - 1 } }"
        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        ← Sebelumnya
      </NuxtLink>
      <span v-else />
      <span class="text-sm text-slate-400">Halaman {{ page }} dari {{ data.totalPages }}</span>
      <NuxtLink
        v-if="page < data.totalPages"
        :to="{ path: '/search', query: { q, page: page + 1 } }"
        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        Berikutnya →
      </NuxtLink>
      <span v-else />
    </nav>
  </div>
</template>
