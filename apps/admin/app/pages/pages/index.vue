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
  <div>
    <PageHeader title="Pages" :description="`${visiblePages.length} page`">
      <template #actions>
        <UButton to="/pages/new" icon="i-lucide-plus">Page Baru</UButton>
      </template>
    </PageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="py-3 px-4 font-medium text-slate-500">Judul</th>
              <th class="py-3 px-4 font-medium text-slate-500">Status</th>
              <th class="py-3 px-4 font-medium text-slate-500">Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="page in visiblePages"
              :key="page.id"
              class="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 px-4">
                <NuxtLink :to="`/pages/${page.id}`" class="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
                  {{ page.title || "(Tanpa judul)" }}
                </NuxtLink>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="statusColor[page.status] ?? 'neutral'" variant="subtle">{{ page.status }}</UBadge>
              </td>
              <td class="py-3 px-4 text-slate-500">{{ new Date(page.updatedAt).toLocaleString() }}</td>
            </tr>
            <tr v-if="!visiblePages.length">
              <td colspan="3" class="py-12 text-center text-slate-400">
                <UIcon name="i-lucide-file" class="size-8 mx-auto mb-2 text-slate-300" />
                Belum ada page.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
