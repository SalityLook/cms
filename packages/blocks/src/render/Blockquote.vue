<script setup lang="ts">
import type { BlockNode } from "../schema";

defineProps<{ node: BlockNode }>();
</script>

<template>
  <blockquote><slot /></blockquote>
</template>
