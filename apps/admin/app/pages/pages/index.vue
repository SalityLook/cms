<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: pages } = await useApiFetch<PageSummary[]>("/api/pages");

const visiblePages = computed(() => pages.value?.filter((page) => page.status !== "trashed") ?? []);

const statusColor: Record<string, "neutral" | "success" | "warning" | "info" | "error"> = {
  draft: "neutral",
  published: "success",
  pending: "warning",
  scheduled: "info",
  trashed: "error"
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="font-semibold">SelfTaught CMS</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>Pages</span>
      </div>
      <UButton to="/pages/new" size="sm">Page Baru</UButton>
    </header>

    <main class="p-6">
      <UCard>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-gray-200 dark:border-gray-800">
              <th class="py-2 font-medium">Judul</th>
              <th class="py-2 font-medium">Status</th>
              <th class="py-2 font-medium">Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="page in visiblePages" :key="page.id" class="border-b border-gray-100 dark:border-gray-900">
              <td class="py-2">
                <NuxtLink :to="`/pages/${page.id}`" class="text-primary hover:underline">{{ page.title }}</NuxtLink>
              </td>
              <td class="py-2">
                <UBadge :color="statusColor[page.status] ?? 'neutral'" variant="subtle">{{ page.status }}</UBadge>
              </td>
              <td class="py-2 text-gray-500">{{ new Date(page.updatedAt).toLocaleString() }}</td>
            </tr>
            <tr v-if="!visiblePages.length">
              <td colspan="3" class="py-6 text-center text-gray-400">Belum ada page.</td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </main>
  </div>
</template>
