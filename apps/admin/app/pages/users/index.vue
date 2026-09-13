<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: users } = await useApiFetch<UserSummary[]>("/api/users");
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="font-semibold">SelfTaught CMS</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>Users</span>
      </div>
      <div class="flex items-center gap-2">
        <UButton to="/roles" size="sm" variant="ghost">Roles</UButton>
        <UButton to="/users/new" size="sm">User Baru</UButton>
      </div>
    </header>

    <main class="p-6">
      <UCard>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-gray-200 dark:border-gray-800">
              <th class="py-2 font-medium">Email</th>
              <th class="py-2 font-medium">Nama</th>
              <th class="py-2 font-medium">Status</th>
              <th class="py-2 font-medium">Roles</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-gray-100 dark:border-gray-900">
              <td class="py-2">
                <NuxtLink :to="`/users/${user.id}`" class="text-primary hover:underline">{{ user.email }}</NuxtLink>
              </td>
              <td class="py-2">{{ user.displayName }}</td>
              <td class="py-2">
                <UBadge :color="user.status === 'active' ? 'success' : 'error'" variant="subtle">{{ user.status }}</UBadge>
              </td>
              <td class="py-2 text-gray-500">{{ user.roles.join(", ") || "—" }}</td>
            </tr>
            <tr v-if="!users?.length">
              <td colspan="4" class="py-6 text-center text-gray-400">Belum ada user.</td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </main>
  </div>
</template>
