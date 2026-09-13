<script setup lang="ts">
import type { BlockNode } from "../schema";
import MarkWrap from "./MarkWrap.vue";

const props = defineProps<{ node: BlockNode }>();
</script>

<template>
  <MarkWrap :marks="props.node.marks ?? []">{{ props.node.text }}</MarkWrap>
</template>
