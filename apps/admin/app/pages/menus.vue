<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: menuList, refresh: refreshMenus } = await useApiFetch<MenuSummary[]>("/api/menus");
const selectedMenuId = ref<string | null>(menuList.value?.[0]?.id ?? null);

const newMenuKey = ref("");
const newMenuName = ref("");
const menuError = ref("");

async function onCreateMenu() {
  if (!newMenuKey.value.trim() || !newMenuName.value.trim()) return;
  menuError.value = "";
  try {
    const menu = await apiFetch<MenuSummary>("/api/menus", {
      method: "POST",
      body: { key: newMenuKey.value.trim(), name: newMenuName.value.trim() }
    });
    newMenuKey.value = "";
    newMenuName.value = "";
    await refreshMenus();
    selectedMenuId.value = menu.id;
  } catch (err) {
    menuError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal membuat menu.";
  }
}

const items = ref<MenuItemSummary[]>([]);
async function loadItems() {
  if (!selectedMenuId.value) {
    items.value = [];
    return;
  }
  const data = await apiFetch<{ menu: MenuSummary; items: MenuItemSummary[] }>(`/api/menus/${selectedMenuId.value}`);
  items.value = data.items;
}
await loadItems();
watch(selectedMenuId, loadItems);

const { data: pagesData } = await useApiFetch<Paginated<PageSummary>>("/api/pages");
const { data: postsData } = await useApiFetch<Paginated<PostSummary>>("/api/posts");
const contentOptions = computed(() => [
  ...(pagesData.value?.items ?? []).map((p) => ({ label: `Page: ${p.title || "(Tanpa judul)"}`, value: p.id })),
  ...(postsData.value?.items ?? []).map((p) => ({ label: `Post: ${p.title || "(Tanpa judul)"}`, value: p.id }))
]);

const newLabel = ref("");
const newLinkType = ref<MenuItemLinkType>("custom");
const newCustomUrl = ref("");
const newContentId = ref<string | undefined>(undefined);
const itemError = ref("");

const topLevel = computed(() => items.value.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder));
function childrenOf(parentId: string) {
  return items.value.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function onAddItem() {
  if (!selectedMenuId.value || !newLabel.value.trim()) return;
  itemError.value = "";
  try {
    await apiFetch(`/api/menus/${selectedMenuId.value}/items`, {
      method: "POST",
      body: {
        label: newLabel.value.trim(),
        linkType: newLinkType.value,
        customUrl: newLinkType.value === "custom" ? newCustomUrl.value.trim() : undefined,
        contentId: newLinkType.value === "content" ? newContentId.value : undefined,
        sortOrder: topLevel.value.length
      }
    });
    newLabel.value = "";
    newCustomUrl.value = "";
    newContentId.value = undefined;
    await loadItems();
  } catch (err) {
    itemError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menambah item.";
  }
}

async function onDeleteItem(id: string) {
  itemError.value = "";
  try {
    await apiFetch(`/api/menus/${selectedMenuId.value}/items/${id}`, { method: "DELETE" });
    await loadItems();
  } catch (err) {
    itemError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menghapus.";
  }
}

async function moveItem(item: MenuItemSummary, direction: -1 | 1) {
  const siblings = (item.parentId ? childrenOf(item.parentId) : topLevel.value);
  const idx = siblings.findIndex((i) => i.id === item.id);
  const swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;
  const other = siblings[swapIdx]!;
  await Promise.all([
    apiFetch(`/api/menus/${selectedMenuId.value}/items/${item.id}`, { method: "PATCH", body: { sortOrder: other.sortOrder } }),
    apiFetch(`/api/menus/${selectedMenuId.value}/items/${other.id}`, { method: "PATCH", body: { sortOrder: item.sortOrder } })
  ]);
  await loadItems();
}

async function indentItem(item: MenuItemSummary) {
  const idx = topLevel.value.findIndex((i) => i.id === item.id);
  if (idx <= 0) return;
  const newParent = topLevel.value[idx - 1]!;
  await apiFetch(`/api/menus/${selectedMenuId.value}/items/${item.id}`, { method: "PATCH", body: { parentId: newParent.id } });
  await loadItems();
}

async function outdentItem(item: MenuItemSummary) {
  await apiFetch(`/api/menus/${selectedMenuId.value}/items/${item.id}`, { method: "PATCH", body: { parentId: null } });
  await loadItems();
}
</script>

<template>
  <div>
    <PageHeader title="Menus" description="Kelola navigasi situs publik (mis. key 'primary' untuk header, 'footer' untuk footer)." />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard class="lg:col-span-1 h-fit">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Menu</h2>
        </template>
        <div class="space-y-1 mb-4">
          <button
            v-for="menu in menuList"
            :key="menu.id"
            type="button"
            class="w-full text-left rounded-lg px-3 py-2 text-sm transition-colors"
            :class="selectedMenuId === menu.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'"
            @click="selectedMenuId = menu.id"
          >
            {{ menu.name }} <span class="text-slate-400">({{ menu.key }})</span>
          </button>
          <p v-if="!menuList?.length" class="text-sm text-slate-400 px-3 py-2">Belum ada menu.</p>
        </div>

        <form class="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800" @submit.prevent="onCreateMenu">
          <UFormField label="Key (mis. primary, footer)">
            <UInput v-model="newMenuKey" class="w-full" placeholder="primary" />
          </UFormField>
          <UFormField label="Nama">
            <UInput v-model="newMenuName" class="w-full" placeholder="Menu Utama" />
          </UFormField>
          <UButton type="submit" block size="sm">Buat Menu</UButton>
          <p v-if="menuError" class="text-sm text-red-500">{{ menuError }}</p>
        </form>
      </UCard>

      <UCard v-if="selectedMenuId" class="lg:col-span-2">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Item Menu</h2>
        </template>

        <ul class="divide-y divide-slate-100 dark:divide-slate-800 mb-6">
          <template v-for="item in topLevel" :key="item.id">
            <li class="py-2.5 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <span class="font-medium text-sm text-slate-900 dark:text-white">{{ item.label }}</span>
                <span class="text-xs text-slate-400 ml-2 truncate">{{ item.linkType === "custom" ? item.customUrl : "(content)" }}</span>
              </div>
              <div class="flex items-center gap-0.5 shrink-0">
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-arrow-up" @click="moveItem(item, -1)" />
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-arrow-down" @click="moveItem(item, 1)" />
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-indent" @click="indentItem(item)" />
                <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="onDeleteItem(item.id)" />
              </div>
            </li>
            <li v-for="child in childrenOf(item.id)" :key="child.id" class="py-2.5 pl-8 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <span class="font-medium text-sm text-slate-900 dark:text-white">{{ child.label }}</span>
                <span class="text-xs text-slate-400 ml-2 truncate">{{ child.linkType === "custom" ? child.customUrl : "(content)" }}</span>
              </div>
              <div class="flex items-center gap-0.5 shrink-0">
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-arrow-up" @click="moveItem(child, -1)" />
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-arrow-down" @click="moveItem(child, 1)" />
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-outdent" @click="outdentItem(child)" />
                <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="onDeleteItem(child.id)" />
              </div>
            </li>
          </template>
          <li v-if="!items.length" class="py-8 text-center text-slate-400 text-sm">Belum ada item.</li>
        </ul>

        <form class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800" @submit.prevent="onAddItem">
          <div class="flex flex-wrap gap-2">
            <UInput v-model="newLabel" placeholder="Label" class="flex-1 min-w-32" />
            <USelect v-model="newLinkType" :items="[{ label: 'URL custom', value: 'custom' }, { label: 'Pilih konten', value: 'content' }]" value-key="value" class="w-40" />
          </div>
          <UInput v-if="newLinkType === 'custom'" v-model="newCustomUrl" placeholder="https:// atau /path" class="w-full" />
          <USelectMenu v-else v-model="newContentId" :items="contentOptions" value-key="value" placeholder="Pilih page/post..." class="w-full" />
          <UButton type="submit" size="sm">Tambah Item</UButton>
          <p v-if="itemError" class="text-sm text-red-500">{{ itemError }}</p>
        </form>
      </UCard>
    </div>
  </div>
</template>
