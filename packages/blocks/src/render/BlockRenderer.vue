<script setup lang="ts">
import { computed } from "vue";
import { blockRegistry } from "../registry";
import type { BlockNode } from "../schema";
import MarkText from "./MarkText.vue";

const props = defineProps<{ node: BlockNode }>();

const renderer = computed(() => blockRegistry.getRenderer(props.node.type));
</script>

<template>
  <MarkText v-if="node.type === 'text'" :node="node" />
  <component :is="renderer" v-else-if="renderer" :node="node">
    <BlockRenderer v-for="(child, i) in node.content ?? []" :key="i" :node="child" />
  </component>
  <template v-else>
    <BlockRenderer v-for="(child, i) in node.content ?? []" :key="i" :node="child" />
  </template>
</template>
