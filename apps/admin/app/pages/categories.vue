<script setup lang="ts">
definePageMeta({ middleware: "auth" });
</script>

<template>
  <TaxonomyManager taxonomy="category" label="Categories" hierarchical />
</template>
