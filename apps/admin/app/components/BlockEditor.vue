<script setup lang="ts">
import type { ContentDocument } from "@selftaught/core";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { watch } from "vue";

const props = defineProps<{ modelValue: ContentDocument }>();
const emit = defineEmits<{ "update:modelValue": [ContentDocument] }>();

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, Image],
  editorProps: {
    attributes: { class: "prose dark:prose-invert max-w-none focus:outline-none min-h-[16rem]" }
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
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-800 rounded-md p-4">
    <EditorContent :editor="editor" />
  </div>
</template>
