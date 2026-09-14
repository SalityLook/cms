<script setup lang="ts" generic="T">
const props = defineProps<{
  items: T[];
  rowKey: (item: T) => string;
  selectedIds: Set<string>;
  columnsCount: number;
  page: number;
  totalPages: number;
  bulkActions?: { value: string; label: string; color?: "neutral" | "error" | "success" | "warning" }[];
  emptyIcon?: string;
  emptyText?: string;
}>();

const emit = defineEmits<{
  "update:selectedIds": [Set<string>];
  "update:page": [number];
  "bulk-action": [string];
}>();

const allSelected = computed(
  () => props.items.length > 0 && props.items.every((item) => props.selectedIds.has(props.rowKey(item)))
);

function toggleAll() {
  if (allSelected.value) {
    emit("update:selectedIds", new Set());
  } else {
    emit("update:selectedIds", new Set(props.items.map(props.rowKey)));
  }
}

function toggleOne(id: string) {
  const next = new Set(props.selectedIds);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  emit("update:selectedIds", next);
}
</script>

<template>
  <div>
    <div v-if="selectedIds.size && bulkActions?.length" class="flex flex-wrap items-center gap-2 mb-3 rounded-lg bg-brand-50 dark:bg-brand-950 px-4 py-2.5">
      <span class="text-sm font-medium text-brand-700 dark:text-brand-300">{{ selectedIds.size }} dipilih</span>
      <UButton
        v-for="action in bulkActions"
        :key="action.value"
        size="xs"
        :color="action.color ?? 'neutral'"
        variant="soft"
        @click="$emit('bulk-action', action.value)"
      >
        {{ action.label }}
      </UButton>
      <UButton size="xs" variant="ghost" color="neutral" @click="$emit('update:selectedIds', new Set())">Batal</UButton>
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="w-10 py-3 pl-4">
                <input type="checkbox" :checked="allSelected" class="rounded" @change="toggleAll">
              </th>
              <slot name="head" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="rowKey(item)"
              class="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 pl-4">
                <input
                  type="checkbox"
                  class="rounded"
                  :checked="selectedIds.has(rowKey(item))"
                  @change="toggleOne(rowKey(item))"
                >
              </td>
              <slot :item="item" />
            </tr>
            <tr v-if="!items.length">
              <td :colspan="columnsCount + 1" class="py-12 text-center text-slate-400">
                <UIcon v-if="emptyIcon" :name="emptyIcon" class="size-8 mx-auto mb-2 text-slate-300" />
                {{ emptyText ?? "Belum ada data." }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <nav v-if="totalPages > 1" class="flex items-center justify-between mt-6">
      <UButton :disabled="page <= 1" variant="ghost" color="neutral" size="sm" @click="$emit('update:page', page - 1)">
        ← Sebelumnya
      </UButton>
      <span class="text-sm text-slate-400">Halaman {{ page }} dari {{ totalPages }}</span>
      <UButton :disabled="page >= totalPages" variant="ghost" color="neutral" size="sm" @click="$emit('update:page', page + 1)">
        Berikutnya →
      </UButton>
    </nav>
  </div>
</template>
