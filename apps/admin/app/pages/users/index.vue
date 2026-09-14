<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: users } = await useApiFetch<UserSummary[]>("/api/users");
</script>

<template>
  <div>
    <PageHeader title="Users" :description="`${users?.length ?? 0} user`">
      <template #actions>
        <UButton to="/roles" variant="ghost" color="neutral" icon="i-lucide-shield">Roles</UButton>
        <UButton to="/users/new" icon="i-lucide-user-plus">User Baru</UButton>
      </template>
    </PageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="py-3 px-4 font-medium text-slate-500">Email</th>
              <th class="py-3 px-4 font-medium text-slate-500">Nama</th>
              <th class="py-3 px-4 font-medium text-slate-500">Status</th>
              <th class="py-3 px-4 font-medium text-slate-500">Roles</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 px-4">
                <NuxtLink :to="`/users/${user.id}`" class="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
                  {{ user.email }}
                </NuxtLink>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-300">{{ user.displayName }}</td>
              <td class="py-3 px-4">
                <UBadge :color="user.status === 'active' ? 'success' : 'error'" variant="subtle">{{ user.status }}</UBadge>
              </td>
              <td class="py-3 px-4 text-slate-500">{{ user.roles.join(", ") || "—" }}</td>
            </tr>
            <tr v-if="!users?.length">
              <td colspan="4" class="py-12 text-center text-slate-400">Belum ada user.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
