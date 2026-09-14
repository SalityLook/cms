<script setup lang="ts">
// Generic key/value editor over content_meta (packages/core/src/domain/
// content/content-meta-service.ts) -- registered for BOTH "post" and
// "page" via app/plugins/register-core-editor-panels.ts, making the EAV
// pattern first-class instead of the one hardcoded example-plugin panel
// (single fixed key "exampleNote") being the only thing that ever touched
// this table. Values are loosely-typed strings with best-effort JSON
// parsing on save -- pragmatic like WordPress's own custom fields, not a
// typed-field system.
const props = defineProps<{ contentId: string }>();

const route = useRoute();
const prefix = route.path.startsWith("/pages/") ? "pages" : "posts";

const { data: meta, refresh } = await useApiFetch<Record<string, unknown>>(`/api/${prefix}/${props.contentId}/meta`);

const rows = computed(() =>
  Object.entries(meta.value ?? {}).map(([key, value]) => ({
    key,
    display: typeof value === "string" ? value : JSON.stringify(value)
  }))
);

const newKey = ref("");
const newValue = ref("");
const saving = ref(false);
const error = ref("");

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function onAdd() {
  if (!newKey.value.trim()) return;
  error.value = "";
  saving.value = true;
  try {
    await apiFetch(`/api/${prefix}/${props.contentId}/meta`, {
      method: "PUT",
      body: { key: newKey.value.trim(), value: parseValue(newValue.value) }
    });
    newKey.value = "";
    newValue.value = "";
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  } finally {
    saving.value = false;
  }
}

async function onDelete(key: string) {
  await apiFetch(`/api/${prefix}/${props.contentId}/meta/${encodeURIComponent(key)}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div>
    <h2 class="font-semibold text-slate-900 dark:text-white text-sm mb-3">Custom Fields</h2>

    <ul v-if="rows.length" class="divide-y divide-slate-100 dark:divide-slate-800 mb-4">
      <li v-for="row in rows" :key="row.key" class="py-2 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <span class="font-medium text-sm text-slate-900 dark:text-white">{{ row.key }}</span>
          <span class="text-slate-400 text-sm ml-2 truncate">{{ row.display }}</span>
        </div>
        <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" class="shrink-0" @click="onDelete(row.key)" />
      </li>
    </ul>
    <p v-else class="text-sm text-slate-400 mb-4">Belum ada custom field.</p>

    <div class="flex flex-wrap gap-2">
      <UInput v-model="newKey" placeholder="Key" class="flex-1 min-w-24" />
      <UInput v-model="newValue" placeholder="Value" class="flex-1 min-w-24" />
      <UButton :loading="saving" icon="i-lucide-plus" @click="onAdd">Tambah</UButton>
    </div>
    <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
  </div>
</template>
