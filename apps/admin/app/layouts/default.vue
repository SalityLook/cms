<script setup lang="ts">
const { user, clear } = useUserSession();
const route = useRoute();
const mobileNavOpen = ref(false);
const { public: publicConfig } = useRuntimeConfig();

interface NavItem {
  label: string;
  to: string;
  icon: string;
}

const contentNav: NavItem[] = [
  { label: "Dashboard", to: "/", icon: "i-lucide-layout-dashboard" },
  { label: "Posts", to: "/posts", icon: "i-lucide-file-text" },
  { label: "Pages", to: "/pages", icon: "i-lucide-file" },
  { label: "Media", to: "/media", icon: "i-lucide-image" },
  { label: "Categories", to: "/categories", icon: "i-lucide-folder" },
  { label: "Tags", to: "/tags", icon: "i-lucide-tag" },
  { label: "Comments", to: "/comments", icon: "i-lucide-message-square" },
  { label: "Reusable Blocks", to: "/reusable-blocks", icon: "i-lucide-blocks" },
  { label: "Trash", to: "/trash", icon: "i-lucide-trash-2" }
];

const manageNav: NavItem[] = [
  { label: "Menus", to: "/menus", icon: "i-lucide-menu" },
  { label: "Users", to: "/users", icon: "i-lucide-users" },
  { label: "Roles", to: "/roles", icon: "i-lucide-shield" },
  { label: "Import/Export", to: "/import-export", icon: "i-lucide-database" },
  { label: "Plugins & Theme", to: "/plugins", icon: "i-lucide-puzzle" },
  { label: "Settings", to: "/settings", icon: "i-lucide-settings" }
];

function isActive(to: string) {
  if (to === "/") return route.path === "/";
  return route.path === to || route.path.startsWith(`${to}/`);
}

async function onLogout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  await navigateTo("/login");
}

const initials = computed(() => {
  const name = user.value?.displayName ?? "";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Desktop sidebar -->
    <aside
      class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-slate-200 dark:lg:border-slate-800 bg-white dark:bg-slate-900"
    >
      <div class="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <BrandLogo />
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div class="space-y-0.5">
          <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Konten</p>
          <NuxtLink
            v-for="item in contentNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="
              isActive(item.to)
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            "
          >
            <UIcon :name="item.icon" class="size-4.5 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </div>

        <div class="space-y-0.5">
          <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kelola</p>
          <NuxtLink
            v-for="item in manageNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="
              isActive(item.to)
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            "
          >
            <UIcon :name="item.icon" class="size-4.5 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <div class="p-3 border-t border-slate-200 dark:border-slate-800">
        <UDropdownMenu
          :items="[[{ label: user?.displayName, icon: 'i-lucide-user', disabled: true }], [{ label: 'Keluar', icon: 'i-lucide-log-out', onSelect: onLogout }]]"
          :content="{ side: 'top', align: 'start' }"
        >
          <button
            type="button"
            class="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div
              class="size-8 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center shrink-0"
            >
              {{ initials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ user?.displayName }}</p>
              <p class="text-xs text-slate-500 truncate">{{ user?.email }}</p>
            </div>
            <UIcon name="i-lucide-chevrons-up-down" class="size-4 text-slate-400 shrink-0" />
          </button>
        </UDropdownMenu>
      </div>
    </aside>

    <!-- Mobile off-canvas nav -->
    <USlideover v-model:open="mobileNavOpen" side="left" :ui="{ content: 'w-72' }">
      <template #content>
        <div class="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <BrandLogo />
        </div>
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div class="space-y-0.5">
            <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Konten</p>
            <NuxtLink
              v-for="item in contentNav"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              :class="
                isActive(item.to)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              "
              @click="mobileNavOpen = false"
            >
              <UIcon :name="item.icon" class="size-4.5 shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </div>
          <div class="space-y-0.5">
            <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kelola</p>
            <NuxtLink
              v-for="item in manageNav"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              :class="
                isActive(item.to)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              "
              @click="mobileNavOpen = false"
            >
              <UIcon :name="item.icon" class="size-4.5 shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </div>
        </nav>
        <div class="p-3 border-t border-slate-200 dark:border-slate-800">
          <UButton block variant="ghost" icon="i-lucide-log-out" @click="onLogout">Keluar</UButton>
        </div>
      </template>
    </USlideover>

    <!-- Main column -->
    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur"
      >
        <UButton
          icon="i-lucide-menu"
          variant="ghost"
          color="neutral"
          class="lg:hidden"
          aria-label="Buka navigasi"
          @click="mobileNavOpen = true"
        />
        <div class="flex-1" />
        <UButton :to="publicConfig.siteUrl" target="_blank" variant="ghost" color="neutral" size="sm" icon="i-lucide-external-link">
          Lihat situs
        </UButton>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
