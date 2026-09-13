<script setup lang="ts">
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const { fetch: refreshSession } = useUserSession();

async function onSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { email: email.value, password: password.value }
    });
    await refreshSession();
    await navigateTo("/");
  } catch {
    error.value = "Email atau password salah.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-lg font-semibold">Masuk ke SelfTaught CMS</h1>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Email">
          <UInput v-model="email" type="email" autocomplete="email" required class="w-full" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" />
        </UFormField>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <UButton type="submit" block :loading="loading">Masuk</UButton>
      </form>
    </UCard>
  </div>
</template>
