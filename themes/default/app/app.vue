<script setup lang="ts">
// Custom favicon (set via admin /settings > Site Identity) overrides the
// default SelfTaught one baked into public/favicon.ico.
const { data: branding } = await useFetch("/api/branding");

useHead({
  link: branding.value?.faviconUrl ? [{ rel: "icon", type: "image/png", href: branding.value.faviconUrl }] : []
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
