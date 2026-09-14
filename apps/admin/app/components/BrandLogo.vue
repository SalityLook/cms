<script setup lang="ts">
// Reads the school/organization's own logo (set via /settings > Site
// Identity), falling back to the default SelfTaught wordmark when unset —
// "SelfTaught" is just this CMS's own branding, same as WordPress ships
// with a default theme/logo that every real site replaces.
withDefaults(defineProps<{ imgClass?: string }>(), { imgClass: "h-6 w-auto" });

const { data: branding } = await useApiFetch<{ siteName: string; logoUrl: string | null }>("/api/branding");
</script>

<template>
  <img :src="branding?.logoUrl || '/brand/wordmark.png'" :alt="branding?.siteName || 'SelfTaught'" :class="imgClass">
</template>
