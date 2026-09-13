<script setup lang="ts">
import type { BlockNode } from "../schema";

defineProps<{ node: BlockNode }>();
</script>

<template>
  <ul><slot /></ul>
</template>
