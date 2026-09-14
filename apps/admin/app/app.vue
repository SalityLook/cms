<script setup lang="ts">
// Custom favicon (set via /settings > Site Identity) overrides the default
// SelfTaught one baked into public/favicon.ico -- applied here, once, so
// every page (including login, before any session exists) picks it up.
const { data: branding } = await useApiFetch<{ faviconUrl: string | null }>("/api/branding");

useHead({
  link: branding.value?.faviconUrl ? [{ rel: "icon", type: "image/png", href: branding.value.faviconUrl }] : []
});
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
