<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { search, status, page, selectedIds, clearSelection } = useListQuery();

const queryParams = reactive({
  search: search.value || undefined,
  status: status.value || undefined,
  page: page.value
});

const { data, refresh } = await useApiFetch<Paginated<CommentSummary>>("/api/comments", { query: queryParams });

watch([search, status, page], () => {
  queryParams.search = search.value || undefined;
  queryParams.status = status.value || undefined;
  queryParams.page = page.value;
  refresh();
});

const statusColor: Record<CommentStatus, "neutral" | "success" | "warning" | "error"> = {
  pending: "warning",
  approved: "success",
  spam: "error",
  trash: "neutral"
};

const bulkActions = [
  { value: "approve", label: "Approve", color: "success" as const },
  { value: "spam", label: "Tandai Spam", color: "error" as const },
  { value: "trash", label: "Pindah ke Trash", color: "neutral" as const },
  { value: "delete", label: "Hapus Permanen", color: "error" as const }
];

async function onBulkAction(action: string) {
  await apiFetch("/api/comments/bulk", { method: "POST", body: { ids: [...selectedIds.value], action } });
  clearSelection();
  await refresh();
}

async function onQuickStatus(id: string, status: CommentStatus) {
  await apiFetch(`/api/comments/${id}`, { method: "PATCH", body: { status } });
  await refresh();
}
</script>

<template>
  <div>
    <PageHeader title="Comments" :description="`${data?.total ?? 0} comment`" />

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <UInput v-model="search" placeholder="Cari nama, email, atau isi..." icon="i-lucide-search" class="flex-1 max-w-xs" />
      <USelect
        v-model="status"
        :items="[
          { label: 'Semua status', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Spam', value: 'spam' },
          { label: 'Trash', value: 'trash' }
        ]"
        value-key="value"
        class="w-40"
      />
    </div>

    <AdminDataTable
      :items="data?.items ?? []"
      :row-key="(c) => c.id"
      :selected-ids="selectedIds"
      :page="data?.page ?? 1"
      :total-pages="data?.totalPages ?? 1"
      :columns-count="3"
      :bulk-actions="bulkActions"
      empty-icon="i-lucide-message-square"
      empty-text="Belum ada comment."
      @update:selected-ids="selectedIds = $event"
      @update:page="page = $event"
      @bulk-action="onBulkAction"
    >
      <template #head>
        <th class="py-3 px-4 font-medium text-slate-500">Komentar</th>
        <th class="py-3 px-4 font-medium text-slate-500">Status</th>
        <th class="py-3 px-4 font-medium text-slate-500">Aksi</th>
      </template>
      <template #default="{ item: c }">
        <td class="py-3 px-4 max-w-md">
          <p class="font-medium text-slate-900 dark:text-white text-sm">{{ c.authorName }} <span class="text-slate-400 font-normal">— {{ c.authorEmail }}</span></p>
          <p class="text-sm text-slate-600 dark:text-slate-300 truncate">{{ c.body }}</p>
          <p class="text-xs text-slate-400 mt-0.5">{{ new Date(c.createdAt).toLocaleString() }}</p>
        </td>
        <td class="py-3 px-4">
          <UBadge :color="statusColor[c.status]" variant="subtle">{{ c.status }}</UBadge>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-1">
            <UButton v-if="c.status !== 'approved'" size="xs" variant="ghost" color="success" icon="i-lucide-check" @click="onQuickStatus(c.id, 'approved')" />
            <UButton v-if="c.status !== 'spam'" size="xs" variant="ghost" color="error" icon="i-lucide-shield-alert" @click="onQuickStatus(c.id, 'spam')" />
            <UButton v-if="c.status !== 'trash'" size="xs" variant="ghost" color="neutral" icon="i-lucide-trash-2" @click="onQuickStatus(c.id, 'trash')" />
          </div>
        </td>
      </template>
    </AdminDataTable>
  </div>
</template>
