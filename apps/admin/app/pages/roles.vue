<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: roles } = await useApiFetch<RoleSummary[]>("/api/roles");
</script>

<template>
  <div>
    <PageHeader title="Roles & Capabilities" description="Ringkasan capability per role (read-only)." />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard v-for="role in roles" :key="role.key">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-slate-900 dark:text-white">{{ role.name }}</h2>
          <UBadge v-if="role.isSystem" color="neutral" variant="subtle">system</UBadge>
        </div>
        <p v-if="role.description" class="text-sm text-slate-500 mb-3">{{ role.description }}</p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge v-for="cap in role.capabilities" :key="cap" size="sm" variant="outline" color="neutral">
            {{ cap }}
          </UBadge>
          <span v-if="!role.capabilities.length" class="text-sm text-slate-400">Tidak ada capability.</span>
        </div>
      </UCard>
      <p v-if="!roles?.length" class="col-span-full text-slate-400 text-center py-12">Belum ada role.</p>
    </div>
  </div>
</template>
