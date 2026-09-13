<script setup lang="ts">
import { computed } from "vue";
import type { BlockNode } from "../schema";

const props = defineProps<{ node: BlockNode }>();

const tag = computed(() => `h${Number(props.node.attrs?.level ?? 2)}`);
</script>

<template>
  <component :is="tag"><slot /></component>
</template>
