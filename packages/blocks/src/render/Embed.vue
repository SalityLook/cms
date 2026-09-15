<script setup lang="ts">
import { computed } from "vue";
import type { BlockNode } from "../schema";

const props = defineProps<{ node: BlockNode }>();

// The HTML stored here was already sanitized once by OembedService before
// being written to oembed_cache/the block's own attrs -- never re-fetched
// or re-sanitized at render time (see CLAUDE.md Phase 24 notes on why
// render never depends on a live third-party call).
const html = computed(() => String(props.node.attrs?.html ?? ""));
const providerName = computed(() => String(props.node.attrs?.providerName ?? "embed"));
</script>

<template>
  <div class="embed-block" :data-provider="providerName" v-html="html" />
</template>
