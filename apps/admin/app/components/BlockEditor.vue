<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { watch } from "vue";
import { ReusableBlockRef } from "./reusable-block-extension";

const props = defineProps<{ modelValue: ContentDocument }>();
const emit = defineEmits<{ "update:modelValue": [ContentDocument] }>();

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, Image, ReusableBlockRef],
  editorProps: {
    attributes: {
      class: "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[18rem] px-4 py-3"
    }
  },
  onUpdate: ({ editor: instance }) => {
    emit("update:modelValue", instance.getJSON() as ContentDocument);
  }
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;
    const current = JSON.stringify(editor.value.getJSON());
    if (current !== JSON.stringify(value)) {
      editor.value.commands.setContent(value, false);
    }
  }
);

function insertImage() {
  const url = window.prompt("URL gambar:");
  if (url) editor.value?.chain().focus().setImage({ src: url }).run();
}

interface ReusableBlockSummary {
  id: string;
  title: string;
}

const insertPickerOpen = ref(false);
const reusableBlocks = ref<ReusableBlockSummary[]>([]);
const savingReusable = ref(false);

async function saveAsReusableBlock() {
  const e = editor.value;
  if (!e) return;
  const { from, to } = e.state.selection;
  if (from === to) {
    window.alert("Pilih (blok) konten dulu sebelum menyimpan sebagai reusable block.");
    return;
  }
  const title = window.prompt("Judul untuk reusable block ini:");
  if (!title) return;

  savingReusable.value = true;
  try {
    const slice = e.state.doc.cut(from, to).toJSON() as { content?: unknown[] };
    const created = await apiFetch<ReusableBlockSummary>("/api/reusable-blocks", {
      method: "POST",
      body: { title, content: { version: 1, type: "doc", content: slice.content ?? [] } }
    });
    e.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, { type: "reusableBlockRef", attrs: { reusableBlockId: created.id } })
      .run();
  } finally {
    savingReusable.value = false;
  }
}

async function openInsertPicker() {
  reusableBlocks.value = await apiFetch<ReusableBlockSummary[]>("/api/reusable-blocks");
  insertPickerOpen.value = true;
}

function insertReusableBlock(id: string) {
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: "reusableBlockRef", attrs: { reusableBlockId: id } })
    .run();
  insertPickerOpen.value = false;
}

interface ToolbarButton {
  icon: string;
  label: string;
  active: () => boolean;
  action: () => void;
}

const toolbarGroups = computed<ToolbarButton[][]>(() => {
  const e = editor.value;
  if (!e) return [];
  return [
    [
      { icon: "i-lucide-bold", label: "Bold", active: () => e.isActive("bold"), action: () => e.chain().focus().toggleBold().run() },
      { icon: "i-lucide-italic", label: "Italic", active: () => e.isActive("italic"), action: () => e.chain().focus().toggleItalic().run() },
      { icon: "i-lucide-strikethrough", label: "Strike", active: () => e.isActive("strike"), action: () => e.chain().focus().toggleStrike().run() },
      { icon: "i-lucide-code", label: "Inline code", active: () => e.isActive("code"), action: () => e.chain().focus().toggleCode().run() }
    ],
    [
      { icon: "i-lucide-heading-2", label: "Heading 2", active: () => e.isActive("heading", { level: 2 }), action: () => e.chain().focus().toggleHeading({ level: 2 }).run() },
      { icon: "i-lucide-heading-3", label: "Heading 3", active: () => e.isActive("heading", { level: 3 }), action: () => e.chain().focus().toggleHeading({ level: 3 }).run() }
    ],
    [
      { icon: "i-lucide-list", label: "Bullet list", active: () => e.isActive("bulletList"), action: () => e.chain().focus().toggleBulletList().run() },
      { icon: "i-lucide-list-ordered", label: "Ordered list", active: () => e.isActive("orderedList"), action: () => e.chain().focus().toggleOrderedList().run() },
      { icon: "i-lucide-quote", label: "Quote", active: () => e.isActive("blockquote"), action: () => e.chain().focus().toggleBlockquote().run() },
      { icon: "i-lucide-square-code", label: "Code block", active: () => e.isActive("codeBlock"), action: () => e.chain().focus().toggleCodeBlock().run() }
    ],
    [
      { icon: "i-lucide-image", label: "Sisipkan gambar", active: () => false, action: insertImage },
      { icon: "i-lucide-minus", label: "Garis pemisah", active: () => false, action: () => e.chain().focus().setHorizontalRule().run() }
    ],
    [
      { icon: "i-lucide-save", label: "Simpan sebagai reusable block", active: () => false, action: saveAsReusableBlock },
      { icon: "i-lucide-blocks", label: "Sisipkan reusable block", active: () => false, action: openInsertPicker }
    ],
    [
      { icon: "i-lucide-undo-2", label: "Undo", active: () => false, action: () => e.chain().focus().undo().run() },
      { icon: "i-lucide-redo-2", label: "Redo", active: () => false, action: () => e.chain().focus().redo().run() }
    ]
  ];
});
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-slate-200 dark:border-slate-800"
    >
      <template v-for="(group, gi) in toolbarGroups" :key="gi">
        <div class="flex items-center gap-0.5">
          <button
            v-for="btn in group"
            :key="btn.label"
            type="button"
            :title="btn.label"
            class="size-8 flex items-center justify-center rounded-md transition-colors"
            :class="
              btn.active()
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            "
            @click="btn.action()"
          >
            <UIcon :name="btn.icon" class="size-4" />
          </button>
        </div>
        <div v-if="gi < toolbarGroups.length - 1" class="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
      </template>
    </div>

    <EditorContent :editor="editor" />

    <UModal v-model:open="insertPickerOpen" title="Sisipkan reusable block">
      <template #body>
        <ul v-if="reusableBlocks.length" class="space-y-1">
          <li v-for="block in reusableBlocks" :key="block.id">
            <button
              type="button"
              class="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              @click="insertReusableBlock(block.id)"
            >
              {{ block.title }}
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400 py-4 text-center">Belum ada reusable block. Pilih konten di editor lalu klik "Simpan sebagai reusable block".</p>
      </template>
    </UModal>
  </UCard>
</template>
