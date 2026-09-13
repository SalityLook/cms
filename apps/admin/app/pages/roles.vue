<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: roles } = await useApiFetch<RoleSummary[]>("/api/roles");
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-3">
      <NuxtLink to="/users" class="font-semibold">Users</NuxtLink>
      <span class="text-gray-400">/</span>
      <span>Roles</span>
    </header>

    <main class="p-6 max-w-2xl mx-auto space-y-4">
      <UCard v-for="role in roles" :key="role.key">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-medium">{{ role.name }}</h2>
          <UBadge v-if="role.isSystem" variant="subtle">system</UBadge>
        </div>
        <p v-if="role.description" class="text-sm text-gray-500 mb-3">{{ role.description }}</p>
        <div class="flex flex-wrap gap-1">
          <UBadge v-for="cap in role.capabilities" :key="cap" size="sm" variant="outline">{{ cap }}</UBadge>
          <span v-if="!role.capabilities.length" class="text-sm text-gray-400">Tidak ada capability.</span>
        </div>
      </UCard>
      <p v-if="!roles?.length" class="text-gray-400 text-center py-6">Belum ada role.</p>
    </main>
  </div>
</template>
