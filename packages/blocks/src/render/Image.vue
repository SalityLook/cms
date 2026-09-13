<script setup lang="ts">
import { computed } from "vue";
import type { BlockNode } from "../schema";

const props = defineProps<{ node: BlockNode }>();

const src = computed(() => String(props.node.attrs?.src ?? ""));
const alt = computed(() => String(props.node.attrs?.alt ?? ""));
</script>

<template>
  <img :src="src" :alt="alt" />
</template>
