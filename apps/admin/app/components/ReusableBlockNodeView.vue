<script setup lang="ts">
import { BlockRenderer } from "@selftaught/blocks";
import type { ContentDocument } from "@selftaught/core";
import type { NodeViewProps } from "@tiptap/vue-3";
import { NodeViewWrapper } from "@tiptap/vue-3";

const props = defineProps<NodeViewProps>();

interface ReusableBlockDetail {
  id: string;
  title: string;
  content: ContentDocument;
}

const block = ref<ReusableBlockDetail | null>(null);
const loading = ref(true);
const editorOpen = ref(false);
const draftDoc = ref<ContentDocument | null>(null);
const saving = ref(false);

async function load() {
  loading.value = true;
  const id = props.node.attrs.reusableBlockId as string;
  try {
    block.value = await apiFetch<ReusableBlockDetail>(`/api/reusable-blocks/${id}`);
  } catch {
    block.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function openEditor() {
  if (!block.value) return;
  draftDoc.value = JSON.parse(JSON.stringify(block.value.content)) as ContentDocument;
  editorOpen.value = true;
}

async function saveSource() {
  if (!block.value || !draftDoc.value) return;
  saving.value = true;
  try {
    await apiFetch(`/api/reusable-blocks/${block.value.id}`, {
      method: "PUT",
      body: { content: draftDoc.value }
    });
    editorOpen.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NodeViewWrapper class="my-2">
    <div class="rounded-lg border-2 border-dashed border-brand-300 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/30 overflow-hidden" contenteditable="false">
      <div class="flex items-center justify-between px-3 py-2 bg-brand-50 dark:bg-brand-950 border-b border-brand-200 dark:border-brand-800">
        <span class="text-xs font-medium text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
          <UIcon name="i-lucide-blocks" class="size-3.5" />
          Reusable block: {{ block?.title ?? "..." }} — tersinkron
        </span>
        <UButton size="xs" variant="soft" color="neutral" @click="openEditor">Edit sumber</UButton>
      </div>
      <div class="px-4 py-3 prose prose-slate dark:prose-invert max-w-none opacity-90 pointer-events-none">
        <p v-if="loading" class="text-slate-400 text-sm">Memuat...</p>
        <p v-else-if="!block" class="text-red-500 text-sm">Reusable block tidak ditemukan (mungkin sudah dihapus).</p>
        <BlockRenderer v-for="(n, i) in block.content.content" v-else :key="i" :node="n as never" />
      </div>
    </div>

    <USlideover v-model:open="editorOpen" :ui="{ content: 'w-full max-w-2xl' }">
      <template #content>
        <div class="p-4 flex flex-col h-full">
          <h2 class="font-semibold text-slate-900 dark:text-white mb-4">Edit sumber: {{ block?.title }}</h2>
          <p class="text-xs text-slate-400 mb-3">
            Perubahan di sini langsung tersimpan ke reusable block itu sendiri dan langsung berlaku di SEMUA post/page yang memakainya.
          </p>
          <div class="flex-1 overflow-y-auto">
            <BlockEditor v-if="draftDoc" v-model="draftDoc" />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <UButton variant="ghost" color="neutral" @click="editorOpen = false">Batal</UButton>
            <UButton :loading="saving" @click="saveSource">Simpan ke sumber</UButton>
          </div>
        </div>
      </template>
    </USlideover>
  </NodeViewWrapper>
</template>
