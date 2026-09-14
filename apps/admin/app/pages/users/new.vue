<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: roles } = await useApiFetch<RoleSummary[]>("/api/roles");

const email = ref("");
const password = ref("");
const displayName = ref("");
const selectedRoleKeys = ref<string[]>([]);
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
    const user = await apiFetch<{ id: string }>("/api/users", {
      method: "POST",
      body: { email: email.value, password: password.value, displayName: displayName.value, roleKeys: selectedRoleKeys.value }
    });
    await navigateTo(`/users/${user.id}`);
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal membuat user.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="User Baru">
      <template #actions>
        <UButton to="/users" variant="ghost" color="neutral">Batal</UButton>
        <UButton :loading="saving" icon="i-lucide-check" @click="onSave">Simpan</UButton>
      </template>
    </PageHeader>

    <div class="max-w-lg space-y-4">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Email">
            <UInput v-model="email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Nama Tampilan">
            <UInput v-model="displayName" class="w-full" />
          </UFormField>
          <UFormField label="Password (min. 8 karakter)">
            <UInput v-model="password" type="password" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Roles</h2>
        </template>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="role in roles"
            :key="role.key"
            size="sm"
            :color="selectedRoleKeys.includes(role.key) ? 'primary' : 'neutral'"
            :variant="selectedRoleKeys.includes(role.key) ? 'solid' : 'outline'"
            @click="toggleRole(role.key)"
          >
            {{ role.name }}
          </UButton>
        </div>
      </UCard>

      <UAlert v-if="error" color="error" variant="subtle" :title="error" />
    </div>
  </div>
</template>
