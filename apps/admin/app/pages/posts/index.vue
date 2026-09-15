<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { search, status, page, selectedIds, clearSelection } = useListQuery();

// useApiFetch (Gotcha #13/#17) doesn't auto-refetch on reactive query changes
// -- the fetcher closure captures `opts` once. A stable `reactive()` query
// object (mutated, not replaced) plus an explicit `refresh()` on change
// works because the closure reads its properties fresh at call time.
const queryParams = reactive({
  search: search.value || undefined,
  status: status.value || undefined,
  page: page.value
});

const { data, refresh } = await useApiFetch<Paginated<PostSummary>>("/api/posts", { query: queryParams });

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
  await apiFetch("/api/posts/bulk", { method: "POST", body: { ids: [...selectedIds.value], action } });
  clearSelection();
  await refresh();
}

async function onDuplicate(postId: string) {
  const duplicate = await apiFetch<PostSummary>(`/api/posts/${postId}/duplicate`, { method: "POST" });
  await navigateTo(`/posts/${duplicate.id}`);
}
</script>

<template>
  <div>
    <PageHeader title="Posts" :description="`${data?.total ?? 0} post`">
      <template #actions>
        <UButton to="/trash" variant="ghost" color="neutral" icon="i-lucide-trash-2">Trash</UButton>
        <UButton to="/posts/new" icon="i-lucide-plus">Post Baru</UButton>
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
      :row-key="(post) => post.id"
      :selected-ids="selectedIds"
      :page="data?.page ?? 1"
      :total-pages="data?.totalPages ?? 1"
      :columns-count="4"
      :bulk-actions="bulkActions"
      empty-icon="i-lucide-file-text"
      empty-text="Belum ada post."
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
      <template #default="{ item: post }">
        <td class="py-3 px-4">
          <NuxtLink :to="`/posts/${post.id}`" class="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
            {{ post.title || "(Tanpa judul)" }}
          </NuxtLink>
        </td>
        <td class="py-3 px-4">
          <UBadge :color="statusColor[post.status] ?? 'neutral'" variant="subtle">{{ post.status }}</UBadge>
        </td>
        <td class="py-3 px-4 text-slate-500">{{ new Date(post.updatedAt).toLocaleString() }}</td>
        <td class="py-3 px-4 text-right">
          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-copy" @click="onDuplicate(post.id)">Duplikat</UButton>
        </td>
      </template>
    </AdminDataTable>
  </div>
</template>
