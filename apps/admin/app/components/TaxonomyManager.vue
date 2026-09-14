<script setup lang="ts">
const props = defineProps<{ taxonomy: string; label: string; hierarchical?: boolean }>();

const { data: tree, refresh } = await useApiFetch<TermTreeNode[]>(`/api/taxonomy/${props.taxonomy}/tree`);

const name = ref("");
const slug = ref("");
const parentId = ref<string | null>(null);
const error = ref("");
const saving = ref(false);
const editingId = ref<string | null>(null);
const editName = ref("");
const editSlug = ref("");
const editParentId = ref<string | null>(null);
const editError = ref("");

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

watch(name, (value) => {
  if (!slug.value) slug.value = slugify(value);
});

// Flattened (with depth) for indented rendering -- simpler than a
// recursive sub-component for what's normally a shallow, small tree.
interface FlatRow extends TermTreeNode {
  depth: number;
}
function flatten(nodes: TermTreeNode[], depth = 0): FlatRow[] {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)]);
}
const flatTerms = computed(() => flatten(tree.value ?? []));
const totalCount = computed(() => flatTerms.value.length);

// Parent picker options exclude the term being edited (a term can't be its own parent, checked server-side too).
function parentOptions(excludeId?: string) {
  return [
    { label: "(tidak ada — top-level)", value: null },
    ...flatTerms.value.filter((t) => t.id !== excludeId).map((t) => ({ label: "—".repeat(t.depth) + " " + t.name, value: t.id }))
  ];
}

async function onCreate() {
  error.value = "";
  saving.value = true;
  try {
    await apiFetch(`/api/taxonomy/${props.taxonomy}`, {
      method: "POST",
      body: { name: name.value, slug: slug.value, parentId: props.hierarchical ? parentId.value : undefined }
    });
    name.value = "";
    slug.value = "";
    parentId.value = null;
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  } finally {
    saving.value = false;
  }
}

function startEdit(term: FlatRow) {
  editingId.value = term.id;
  editName.value = term.name;
  editSlug.value = term.slug;
  editParentId.value = term.parentId;
  editError.value = "";
}

function cancelEdit() {
  editingId.value = null;
  editError.value = "";
}

async function onSaveEdit(id: string) {
  editError.value = "";
  try {
    await apiFetch(`/api/taxonomy/${props.taxonomy}/${id}`, {
      method: "PATCH",
      body: { name: editName.value, slug: editSlug.value, parentId: props.hierarchical ? editParentId.value : undefined }
    });
    editingId.value = null;
    await refresh();
  } catch (err) {
    editError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  }
}

async function onDelete(id: string) {
  error.value = "";
  try {
    await apiFetch(`/api/taxonomy/${props.taxonomy}/${id}`, { method: "DELETE" });
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menghapus.";
  }
}
</script>

<template>
  <div>
    <PageHeader :title="label" :description="`${totalCount} ${label.toLowerCase()}`" />

    <UAlert v-if="error" color="error" variant="subtle" :title="error" class="mb-4" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard class="lg:col-span-1 h-fit">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Tambah {{ label.toLowerCase() }}</h2>
        </template>
        <form class="space-y-3" @submit.prevent="onCreate">
          <UFormField label="Nama">
            <UInput v-model="name" class="w-full" placeholder="mis. Teknologi" />
          </UFormField>
          <UFormField label="Slug">
            <UInput v-model="slug" class="w-full" placeholder="teknologi" />
          </UFormField>
          <UFormField v-if="hierarchical" label="Parent (opsional)">
            <USelectMenu v-model="parentId" :items="parentOptions()" value-key="value" class="w-full" />
          </UFormField>
          <UButton type="submit" block :loading="saving">Tambah</UButton>
        </form>
      </UCard>

      <UCard class="lg:col-span-2" :ui="{ body: 'p-0 sm:p-0' }">
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="term in flatTerms" :key="term.id" class="px-4">
            <div v-if="editingId !== term.id" class="py-3 flex items-center justify-between gap-2">
              <div :style="{ paddingLeft: `${term.depth * 1.25}rem` }" class="min-w-0">
                <span class="font-medium text-slate-900 dark:text-white">{{ term.name }}</span>
                <span class="text-slate-400 text-sm ml-2">/{{ term.slug }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" @click="startEdit(term)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="onDelete(term.id)" />
              </div>
            </div>
            <div v-else class="py-3 space-y-2">
              <div class="flex flex-wrap gap-2">
                <UInput v-model="editName" placeholder="Nama" class="flex-1 min-w-32" />
                <UInput v-model="editSlug" placeholder="Slug" class="flex-1 min-w-32" />
              </div>
              <USelectMenu
                v-if="hierarchical"
                v-model="editParentId"
                :items="parentOptions(term.id)"
                value-key="value"
                class="w-full"
              />
              <p v-if="editError" class="text-sm text-red-500">{{ editError }}</p>
              <div class="flex gap-2">
                <UButton size="xs" @click="onSaveEdit(term.id)">Simpan</UButton>
                <UButton size="xs" variant="ghost" color="neutral" @click="cancelEdit">Batal</UButton>
              </div>
            </div>
          </li>
          <li v-if="!flatTerms.length" class="py-12 text-center text-slate-400">
            Belum ada {{ label.toLowerCase() }}.
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
