<script setup lang="ts">
definePageMeta({ layout: false });

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
  <div class="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
    <!-- Branding side (hidden on small screens) -->
    <div
      class="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 text-white relative overflow-hidden"
    >
      <div
        class="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        class="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-brand-400/10 blur-3xl"
      />
      <div class="relative flex items-center gap-2">
        <div class="size-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-bold">S</div>
        <span class="font-semibold tracking-tight">SelfTaught CMS</span>
      </div>
      <div class="relative max-w-sm">
        <p class="text-2xl font-serif leading-snug">
          "Publikasikan konten dengan percaya diri — dibangun untuk kecepatan, kejelasan, dan kontrol penuh."
        </p>
      </div>
      <p class="relative text-sm text-brand-200">© {{ new Date().getFullYear() }} SelfTaught CMS</p>
    </div>

    <!-- Form side -->
    <div class="flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2 lg:hidden">
          <div class="size-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">S</div>
          <span class="font-semibold tracking-tight text-slate-900 dark:text-white">SelfTaught CMS</span>
        </div>

        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Selamat datang kembali</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Masuk ke dashboard untuk mengelola konten.</p>

        <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
          <UFormField label="Email">
            <UInput
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="nama@contoh.com"
              icon="i-lucide-mail"
              size="lg"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField label="Password">
            <UInput
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              required
              class="w-full"
            />
          </UFormField>

          <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-alert-circle" :title="error" />

          <UButton type="submit" block size="lg" :loading="loading">Masuk</UButton>
        </form>
      </div>
    </div>
  </div>
</template>
