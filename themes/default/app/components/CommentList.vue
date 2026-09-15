<script setup lang="ts">
// Recursive (calls itself for replies) -- runs without explicit
// registration in Vue 3 <script setup>, same pattern as BlockRenderer.vue
// (see CLAUDE.md Gotcha #10).
interface CommentNode {
  id: string;
  parentId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

const props = defineProps<{ comments: CommentNode[]; parentId?: string | null; depth?: number }>();

const children = computed(() => props.comments.filter((c) => c.parentId === (props.parentId ?? null)));

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
</script>

<template>
  <ul :class="depth ? 'mt-4 ml-6 space-y-4 border-l border-slate-200 dark:border-slate-800 pl-4' : 'space-y-6'">
    <li v-for="c in children" :key="c.id">
      <div class="flex items-baseline gap-2">
        <span class="font-medium text-sm text-slate-900 dark:text-white">{{ c.authorName }}</span>
        <span class="text-xs text-slate-400">{{ formatDate(c.createdAt) }}</span>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{{ c.body }}</p>
      <CommentList :comments="comments" :parent-id="c.id" :depth="(depth ?? 0) + 1" />
    </li>
  </ul>
</template>
