<script setup lang="ts">
// Reads the school/organization's own logo (set via admin /settings > Site
// Identity), falling back to the default SelfTaught wordmark when unset.
withDefaults(defineProps<{ imgClass?: string }>(), { imgClass: "h-6 w-auto" });

const { data: branding } = await useFetch("/api/branding");
</script>

<template>
  <img :src="branding?.logoUrl || '/brand/wordmark.png'" :alt="branding?.siteName || 'SelfTaught'" :class="imgClass">
</template>
