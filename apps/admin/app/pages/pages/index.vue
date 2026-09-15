<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { search, status, page, selectedIds, clearSelection } = useListQuery();

const queryParams = reactive({
  search: search.value || undefined,
  status: status.value || undefined,
  page: page.value
});

const { data, refresh } = await useApiFetch<Paginated<PageSummary>>("/api/pages", { query: queryParams });

watch([search, status, page], () => {
  queryParams.search = search.value || undefined;
  queryParams.status = status.value || undefined;
  queryParams.page = page.value;
  refresh();
});

const statusColor: Record<string, "neutral" | "success" | "warning" | "info" | "error"> = {
  draft: "neutral",
  published: "success",
  pending: "warning",
  scheduled: "info",
  trashed: "error"
};

const bulkActions = [
  { value: "publish", label: "Publish", color: "success" as const },
  { value: "unpublish", label: "Batalkan Publish", color: "neutral" as const },
  { value: "trash", label: "Pindah ke Trash", color: "error" as const }
];

async function onBulkAction(action: string) {
  await apiFetch("/api/pages/bulk", { method: "POST", body: { ids: [...selectedIds.value], action } });
  clearSelection();
  await refresh();
}

async function onDuplicate(pageId: string) {
  const duplicate = await apiFetch<PageSummary>(`/api/pages/${pageId}/duplicate`, { method: "POST" });
  await navigateTo(`/pages/${duplicate.id}`);
}
</script>

<template>
  <div>
    <PageHeader title="Pages" :description="`${data?.total ?? 0} page`">
      <template #actions>
        <UButton to="/pages/new" icon="i-lucide-plus">Page Baru</UButton>
      </template>
    </PageHeader>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <UInput v-model="search" placeholder="Cari judul atau slug..." icon="i-lucide-search" class="flex-1 max-w-xs" />
      <USelect
        v-model="status"
        :items="[
          { label: 'Semua status', value: '' },
          { label: 'Draft', value: 'draft' },
          { label: 'Pending', value: 'pending' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Published', value: 'published' },
          { label: 'Trashed', value: 'trashed' }
        ]"
        value-key="value"
        class="w-40"
      />
    </div>

    <AdminDataTable
      :items="data?.items ?? []"
      :row-key="(pg) => pg.id"
      :selected-ids="selectedIds"
      :page="data?.page ?? 1"
      :total-pages="data?.totalPages ?? 1"
      :columns-count="4"
      :bulk-actions="bulkActions"
      empty-icon="i-lucide-file"
      empty-text="Belum ada page."
      @update:selected-ids="selectedIds = $event"
      @update:page="page = $event"
      @bulk-action="onBulkAction"
    >
      <template #head>
        <th class="py-3 px-4 font-medium text-slate-500">Judul</th>
        <th class="py-3 px-4 font-medium text-slate-500">Status</th>
        <th class="py-3 px-4 font-medium text-slate-500">Diperbarui</th>
        <th class="py-3 px-4 font-medium text-slate-500 text-right">Aksi</th>
      </template>
      <template #default="{ item: pg }">
        <td class="py-3 px-4">
          <NuxtLink :to="`/pages/${pg.id}`" class="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
            {{ pg.title || "(Tanpa judul)" }}
          </NuxtLink>
        </td>
        <td class="py-3 px-4">
          <UBadge :color="statusColor[pg.status] ?? 'neutral'" variant="subtle">{{ pg.status }}</UBadge>
        </td>
        <td class="py-3 px-4 text-slate-500">{{ new Date(pg.updatedAt).toLocaleString() }}</td>
        <td class="py-3 px-4 text-right">
          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-copy" @click="onDuplicate(pg.id)">Duplikat</UButton>
        </td>
      </template>
    </AdminDataTable>
  </div>
</template>
