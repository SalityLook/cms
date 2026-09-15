<script setup lang="ts">
import type { NodeViewProps } from "@tiptap/vue-3";
import { NodeViewWrapper } from "@tiptap/vue-3";

const props = defineProps<NodeViewProps>();
</script>

<template>
  <NodeViewWrapper class="my-2">
    <div class="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden" contenteditable="false">
      <div class="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800">
        Embed: {{ props.node.attrs.providerName }}
      </div>
      <div class="p-3 pointer-events-none" v-html="props.node.attrs.html" />
    </div>
  </NodeViewWrapper>
</template>
