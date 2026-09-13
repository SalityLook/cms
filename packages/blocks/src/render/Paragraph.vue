<script setup lang="ts">
import type { BlockNode } from "../schema";

defineProps<{ node: BlockNode }>();
</script>

<template>
  <p><slot /></p>
</template>
