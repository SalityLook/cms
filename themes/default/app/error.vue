<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

function handleRetry() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-950">
    <div class="text-center max-w-md">
      <div class="flex items-center justify-center mb-8">
        <img src="/brand/wordmark.png" alt="SelfTaught" class="h-6 w-auto">
      </div>
      <p class="font-serif text-7xl font-semibold text-brand-600/20 dark:text-brand-400/20 mb-4">{{ error.statusCode }}</p>
      <h1 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ error.statusCode === 404 ? "Halaman tidak ditemukan" : "Terjadi kesalahan" }}
      </h1>
      <p class="text-slate-500 dark:text-slate-400 mb-8">{{ error.statusMessage }}</p>
      <button
        class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        @click="handleRetry"
      >
        Kembali ke beranda
      </button>
    </div>
  </div>
</template>
