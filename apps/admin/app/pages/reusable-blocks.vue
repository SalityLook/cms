<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface ReusableBlockRow {
  id: string;
  title: string;
  usageCount: number;
  updatedAt: string;
}

const { data: blocks, refresh } = await useApiFetch<ReusableBlockRow[]>("/api/reusable-blocks");
const errorMessage = ref("");

async function onRename(block: ReusableBlockRow) {
  const title = window.prompt("Judul baru:", block.title);
  if (!title || title === block.title) return;
  await apiFetch(`/api/reusable-blocks/${block.id}`, { method: "PUT", body: { title } });
  await refresh();
}

async function onDelete(block: ReusableBlockRow) {
  if (!window.confirm(`Hapus reusable block "${block.title}"?`)) return;
  errorMessage.value = "";
  try {
    await apiFetch(`/api/reusable-blocks/${block.id}`, { method: "DELETE" });
    await refresh();
  } catch (err) {
    errorMessage.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menghapus.";
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Reusable Blocks"
      description="Blok konten yang tersinkron -- mengedit di sini langsung berubah di semua post/page yang memakainya."
    />

    <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="py-3 px-4 font-medium text-slate-500">Judul</th>
              <th class="py-3 px-4 font-medium text-slate-500">Dipakai di</th>
              <th class="py-3 px-4 font-medium text-slate-500">Diperbarui</th>
              <th class="py-3 px-4 font-medium text-slate-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="block in blocks"
              :key="block.id"
              class="border-b border-slate-100 dark:border-slate-800/60 last:border-0"
            >
              <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">{{ block.title }}</td>
              <td class="py-3 px-4 text-slate-500">{{ block.usageCount }} post/page</td>
              <td class="py-3 px-4 text-slate-500">{{ new Date(block.updatedAt).toLocaleString() }}</td>
              <td class="py-3 px-4 text-right space-x-1">
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" @click="onRename(block)">Ganti judul</UButton>
                <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="onDelete(block)">Hapus</UButton>
              </td>
            </tr>
            <tr v-if="!blocks?.length">
              <td colspan="4" class="py-12 text-center text-slate-400">
                <UIcon name="i-lucide-blocks" class="size-8 mx-auto mb-2 text-slate-300" />
                Belum ada reusable block. Buat dari editor post/page ("Simpan sebagai reusable block").
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
