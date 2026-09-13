<script setup lang="ts">
import type { BlockNode } from "../schema";

defineProps<{ node: BlockNode }>();
</script>

<template>
  <pre><code><slot /></code></pre>
</template>
