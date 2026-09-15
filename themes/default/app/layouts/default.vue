<script setup lang="ts">
interface ResolvedMenuItem {
  id: string;
  label: string;
  url: string;
  openInNewTab: boolean;
  children: ResolvedMenuItem[];
}

const mobileMenuOpen = ref(false);
const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  }
);

const fallbackNavLinks: ResolvedMenuItem[] = [
  { id: "fallback-home", label: "Beranda", url: "/", openInNewTab: false, children: [] },
  { id: "fallback-blog", label: "Blog", url: "/blog", openInNewTab: false, children: [] }
];
const fallbackFooterLinks: ResolvedMenuItem[] = fallbackNavLinks;

const { data: primaryMenu } = await useFetch<ResolvedMenuItem[]>("/api/menus/primary");
const { data: footerMenu } = await useFetch<ResolvedMenuItem[]>("/api/menus/footer");

const navLinks = computed(() => (primaryMenu.value && primaryMenu.value.length > 0 ? primaryMenu.value : fallbackNavLinks));
const footerLinks = computed(() => (footerMenu.value && footerMenu.value.length > 0 ? footerMenu.value : fallbackFooterLinks));
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
            :key="link.id"
            :to="link.url"
            :target="link.openInNewTab ? '_blank' : undefined"
            class="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            active-class="!text-brand-600 dark:!text-brand-400"
          >
            {{ link.label }}
          </NuxtLink>
          <form method="get" action="/search" class="flex items-center">
            <input
              type="search"
              name="q"
              placeholder="Cari..."
              class="w-32 focus:w-48 transition-all rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>
        </nav>

        <div class="flex items-center gap-1 sm:hidden">
          <NuxtLink
            to="/search"
            class="size-9 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300"
            aria-label="Cari"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </NuxtLink>
          <button
            type="button"
            class="size-9 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300"
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
      </div>

      <nav v-if="mobileMenuOpen" class="sm:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.id"
          :to="link.url"
          :target="link.openInNewTab ? '_blank' : undefined"
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
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.id"
            :to="link.url"
            :target="link.openInNewTab ? '_blank' : undefined"
            class="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
