<script setup lang="ts">
const mobileMenuOpen = ref(false);
const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  }
);

const navLinks = [
  { label: "Beranda", to: "/" },
  { label: "Blog", to: "/blog" }
];
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-slate-950">
    <header class="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center">
          <BrandLogo />
        </NuxtLink>

        <nav class="hidden sm:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            active-class="!text-brand-600 dark:!text-brand-400"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <button
          type="button"
          class="sm:hidden size-9 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300"
          aria-label="Buka menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav v-if="mobileMenuOpen" class="sm:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
          active-class="!text-brand-600 dark:!text-brand-400 bg-brand-50 dark:bg-brand-950"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-slate-200 dark:border-slate-800">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <p>© {{ new Date().getFullYear() }} SelfTaught CMS. Dibangun dengan Nuxt.</p>
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="hover:text-slate-900 dark:hover:text-white transition-colors">Beranda</NuxtLink>
          <NuxtLink to="/blog" class="hover:text-slate-900 dark:hover:text-white transition-colors">Blog</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
