<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { user, clear } = useUserSession();
const { data: me } = await useFetch("/api/auth/me");

async function onLogout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <h1 class="font-semibold">SelfTaught CMS</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ user?.displayName }}</span>
        <UButton size="sm" variant="ghost" @click="onLogout">Keluar</UButton>
      </div>
    </header>

    <main class="p-6 space-y-4">
      <UCard>
        <p>
          Selamat datang, <strong>{{ user?.displayName }}</strong>.
        </p>
        <p class="text-sm text-gray-500 mt-2">Roles: {{ me?.roles.join(", ") }}</p>
        <p class="text-sm text-gray-500">Capabilities: {{ me?.capabilities.join(", ") }}</p>
      </UCard>

      <UCard class="flex flex-wrap gap-4">
        <NuxtLink to="/posts" class="text-primary hover:underline">Posts →</NuxtLink>
        <NuxtLink to="/media" class="text-primary hover:underline">Media →</NuxtLink>
        <NuxtLink to="/categories" class="text-primary hover:underline">Categories →</NuxtLink>
        <NuxtLink to="/tags" class="text-primary hover:underline">Tags →</NuxtLink>
        <NuxtLink to="/users" class="text-primary hover:underline">Users →</NuxtLink>
        <NuxtLink to="/settings" class="text-primary hover:underline">Settings →</NuxtLink>
      </UCard>
    </main>
  </div>
</template>
