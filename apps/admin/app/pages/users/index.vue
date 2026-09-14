<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { search, status, page, selectedIds, clearSelection } = useListQuery();

const queryParams = reactive({
  search: search.value || undefined,
  status: status.value || undefined,
  page: page.value
});

const { data, refresh } = await useApiFetch<Paginated<UserSummary>>("/api/users", { query: queryParams });

watch([search, status, page], () => {
  queryParams.search = search.value || undefined;
  queryParams.status = status.value || undefined;
  queryParams.page = page.value;
  refresh();
});

const bulkActions = [
  { value: "activate", label: "Aktifkan", color: "success" as const },
  { value: "suspend", label: "Suspend", color: "error" as const }
];

async function onBulkAction(action: string) {
  await apiFetch("/api/users/bulk", { method: "POST", body: { ids: [...selectedIds.value], action } });
  clearSelection();
  await refresh();
}
</script>

<template>
  <div>
    <PageHeader title="Users" :description="`${data?.total ?? 0} user`">
      <template #actions>
        <UButton to="/roles" variant="ghost" color="neutral" icon="i-lucide-shield">Roles</UButton>
        <UButton to="/users/new" icon="i-lucide-user-plus">User Baru</UButton>
      </template>
    </PageHeader>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <UInput v-model="search" placeholder="Cari email atau nama..." icon="i-lucide-search" class="flex-1 max-w-xs" />
      <USelect
        v-model="status"
        :items="[
          { label: 'Semua status', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Suspended', value: 'suspended' }
        ]"
        value-key="value"
        class="w-40"
      />
    </div>

    <AdminDataTable
      :items="data?.items ?? []"
      :row-key="(user) => user.id"
      :selected-ids="selectedIds"
      :page="data?.page ?? 1"
      :total-pages="data?.totalPages ?? 1"
      :columns-count="4"
      :bulk-actions="bulkActions"
      empty-text="Belum ada user."
      @update:selected-ids="selectedIds = $event"
      @update:page="page = $event"
      @bulk-action="onBulkAction"
    >
      <template #head>
        <th class="py-3 px-4 font-medium text-slate-500">Email</th>
        <th class="py-3 px-4 font-medium text-slate-500">Nama</th>
        <th class="py-3 px-4 font-medium text-slate-500">Status</th>
        <th class="py-3 px-4 font-medium text-slate-500">Roles</th>
      </template>
      <template #default="{ item: user }">
        <td class="py-3 px-4">
          <NuxtLink :to="`/users/${user.id}`" class="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
            {{ user.email }}
          </NuxtLink>
        </td>
        <td class="py-3 px-4 text-slate-600 dark:text-slate-300">{{ user.displayName }}</td>
        <td class="py-3 px-4">
          <UBadge :color="user.status === 'active' ? 'success' : 'error'" variant="subtle">{{ user.status }}</UBadge>
        </td>
        <td class="py-3 px-4 text-slate-500">{{ user.roles.join(", ") || "—" }}</td>
      </template>
    </AdminDataTable>
  </div>
</template>
