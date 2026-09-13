<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const id = route.params.id as string;

const { data: user, refresh } = await useApiFetch<UserSummary>(`/api/users/${id}`);
if (!user.value) {
  throw createError({ statusCode: 404, statusMessage: "User not found" });
}

const { data: roles } = await useApiFetch<RoleSummary[]>("/api/roles");

const displayName = ref(user.value.displayName);
const status = ref<UserStatus>(user.value.status);
const selectedRoleKeys = ref<string[]>([...user.value.roles]);
const saving = ref(false);
const error = ref("");

function toggleRole(key: string) {
  const idx = selectedRoleKeys.value.indexOf(key);
  if (idx === -1) {
    selectedRoleKeys.value.push(key);
  } else {
    selectedRoleKeys.value.splice(idx, 1);
  }
}

async function onSave() {
  error.value = "";
  saving.value = true;
  try {
    await apiFetch(`/api/users/${id}`, {
      method: "PATCH",
      body: { displayName: displayName.value, status: status.value, roleKeys: selectedRoleKeys.value }
    });
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/users" class="font-semibold">Users</NuxtLink>
        <span class="text-gray-400">/</span>
        <span>{{ user?.email }}</span>
      </div>
      <UButton :loading="saving" @click="onSave">Simpan</UButton>
    </header>

    <main class="p-6 max-w-lg mx-auto space-y-4">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Email">
            <UInput :model-value="user?.email" class="w-full" disabled />
          </UFormField>
          <UFormField label="Nama Tampilan">
            <UInput v-model="displayName" class="w-full" />
          </UFormField>
          <UFormField label="Status">
            <div class="flex gap-2">
              <UButton size="xs" :color="status === 'active' ? 'success' : 'neutral'" :variant="status === 'active' ? 'solid' : 'outline'" @click="status = 'active'">
                Active
              </UButton>
              <UButton size="xs" :color="status === 'suspended' ? 'error' : 'neutral'" :variant="status === 'suspended' ? 'solid' : 'outline'" @click="status = 'suspended'">
                Suspended
              </UButton>
            </div>
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <h2 class="font-medium mb-3">Roles</h2>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="role in roles"
            :key="role.key"
            size="xs"
            :color="selectedRoleKeys.includes(role.key) ? 'primary' : 'neutral'"
            :variant="selectedRoleKeys.includes(role.key) ? 'solid' : 'outline'"
            @click="toggleRole(role.key)"
          >
            {{ role.name }}
          </UButton>
        </div>
      </UCard>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </main>
  </div>
</template>
