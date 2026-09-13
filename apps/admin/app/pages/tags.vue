<script setup lang="ts">
definePageMeta({ middleware: "auth" });
</script>

<template>
  <TaxonomyManager taxonomy="tag" label="Tags" />
</template>
