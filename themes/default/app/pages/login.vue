<script setup lang="ts">
const { fetch: refreshSession } = useUserSession();
const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

const inputClass =
  "w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

async function onSubmit() {
  error.value = "";
  submitting.value = true;
  try {
    await $fetch("/api/auth/login", { method: "POST", body: { email: email.value, password: password.value } });
    await refreshSession();
    await navigateTo("/account/profile");
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal login.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto px-4 py-16 sm:py-24">
    <h1 class="font-serif text-2xl font-semibold text-slate-900 dark:text-white mb-6 text-center">Masuk</h1>
    <form class="space-y-3" @submit.prevent="onSubmit">
      <input v-model="email" type="email" placeholder="Email" required :class="inputClass">
      <input v-model="password" type="password" placeholder="Kata sandi" required :class="inputClass">
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {{ submitting ? "Memproses..." : "Masuk" }}
      </button>
    </form>
    <p class="text-sm text-slate-500 text-center mt-6">
      Belum punya akun? <NuxtLink to="/register" class="text-brand-600 dark:text-brand-400 hover:underline">Daftar</NuxtLink>
    </p>
  </div>
</template>
