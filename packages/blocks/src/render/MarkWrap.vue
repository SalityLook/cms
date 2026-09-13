<script setup lang="ts">
import { computed } from "vue";
import type { BlockMark } from "../schema";

const props = defineProps<{ marks: BlockMark[] }>();

const tagFor: Record<string, string> = {
  bold: "strong",
  italic: "em",
  code: "code",
  strike: "s"
};

const first = computed(() => props.marks[0]);
const rest = computed(() => props.marks.slice(1));
</script>

<template>
  <template v-if="!first">
    <slot />
  </template>
  <a v-else-if="first.type === 'link'" :href="String(first.attrs?.href ?? '')">
    <MarkWrap :marks="rest"><slot /></MarkWrap>
  </a>
  <component :is="tagFor[first.type] ?? 'span'" v-else>
    <MarkWrap :marks="rest"><slot /></MarkWrap>
  </component>
</template>
