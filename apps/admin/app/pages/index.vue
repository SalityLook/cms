<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { user } = useUserSession();
const { data: me } = await useFetch("/api/auth/me");

// Sequential (not Promise.all) — matches the pattern used everywhere else
// in this app. See CLAUDE.md Gotcha #17: useApiFetch relies on Nuxt's
// composable-context-restoration transform, which targets simple
// `await useXxx()` statements; wrapping calls in Promise.all is untested
// here and risky to introduce without re-verifying SSR end-to-end.
const { data: posts } = await useApiFetch<PostSummary[]>("/api/posts");
const { data: pages } = await useApiFetch<PageSummary[]>("/api/pages");
const { data: media } = await useApiFetch<MediaItem[]>("/api/media");

const publishedPosts = computed(() => posts.value?.filter((p) => p.status === "published").length ?? 0);
const draftPosts = computed(
  () => posts.value?.filter((p) => p.status === "draft" || p.status === "pending").length ?? 0
);

const stats = computed(() => [
  {
    label: "Posts",
    value: posts.value?.filter((p) => p.status !== "trashed").length ?? 0,
    hint: `${publishedPosts.value} terbit`,
    icon: "i-lucide-file-text",
    to: "/posts"
  },
  {
    label: "Pages",
    value: pages.value?.filter((p) => p.status !== "trashed").length ?? 0,
    hint: "halaman statis",
    icon: "i-lucide-file",
    to: "/pages"
  },
  {
    label: "Media",
    value: media.value?.length ?? 0,
    hint: "file terunggah",
    icon: "i-lucide-image",
    to: "/media"
  },
  {
    label: "Draft & Review",
    value: draftPosts.value,
    hint: "perlu tindak lanjut",
    icon: "i-lucide-pencil-line",
    to: "/posts"
  }
]);

const quickLinks = [
  { label: "Post baru", to: "/posts/new", icon: "i-lucide-square-pen" },
  { label: "Page baru", to: "/pages/new", icon: "i-lucide-file-plus" },
  { label: "Unggah media", to: "/media", icon: "i-lucide-upload" },
  { label: "Undang user", to: "/users/new", icon: "i-lucide-user-plus" }
];

const recentPosts = computed(
  () =>
    [...(posts.value ?? [])]
      .filter((p) => p.status !== "trashed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
);

const statusColor: Record<string, "neutral" | "success" | "warning" | "info" | "error"> = {
  draft: "neutral",
  published: "success",
  pending: "warning",
  scheduled: "info",
  trashed: "error"
};
</script>

<template>
  <div>
    <PageHeader title="Dashboard" :description="`Selamat datang kembali, ${user?.displayName}.`" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
          <div
            class="size-9 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900 transition-colors"
          >
            <UIcon :name="stat.icon" class="size-4.5" />
          </div>
        </div>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ stat.value }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ stat.hint }}</p>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-white">Post terbaru</h2>
            <UButton to="/posts" variant="link" size="sm" trailing-icon="i-lucide-arrow-right">Lihat semua</UButton>
          </div>
        </template>

        <ul v-if="recentPosts.length" class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="post in recentPosts" :key="post.id">
            <NuxtLink
              :to="`/posts/${post.id}`"
              class="flex items-center justify-between gap-4 py-3 group"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {{ post.title || "(Tanpa judul)" }}
                </p>
                <p class="text-xs text-slate-400 mt-0.5">{{ new Date(post.updatedAt).toLocaleString() }}</p>
              </div>
              <UBadge :color="statusColor[post.status] ?? 'neutral'" variant="subtle" class="shrink-0">
                {{ post.status }}
              </UBadge>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400 py-8 text-center">Belum ada post.</p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white">Aksi cepat</h2>
        </template>
        <div class="space-y-1">
          <UButton
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            variant="ghost"
            color="neutral"
            block
            :icon="link.icon"
            class="justify-start"
          >
            {{ link.label }}
          </UButton>
        </div>

        <template #footer>
          <p class="text-xs text-slate-400">Role: {{ me?.roles.join(", ") }}</p>
        </template>
      </UCard>
    </div>
  </div>
</template>
