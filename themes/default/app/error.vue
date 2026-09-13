<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

function handleRetry() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <p class="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">{{ error.statusCode }}</p>
      <h1 class="text-xl font-semibold mb-2">
        {{ error.statusCode === 404 ? "Halaman tidak ditemukan" : "Terjadi kesalahan" }}
      </h1>
      <p class="text-gray-500 mb-6">{{ error.statusMessage }}</p>
      <button class="text-primary hover:underline" @click="handleRetry">Kembali ke beranda</button>
    </div>
  </div>
</template>
