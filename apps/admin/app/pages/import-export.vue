<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface ImportCounts {
  content: { total: number; toCreate?: number; toSkip?: number; created?: number; skipped?: number };
  terms: { total?: number; created?: number; skipped?: number };
  media: { total?: number; created?: number };
  comments: { total?: number; created?: number; skipped?: number };
}

const exporting = ref(false);
const error = ref("");

async function onExport() {
  error.value = "";
  exporting.value = true;
  try {
    const bundle = await apiFetch<Record<string, unknown>>("/api/export");
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selftaught-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal export.";
  } finally {
    exporting.value = false;
  }
}

const jsonFileInput = ref<HTMLInputElement | null>(null);
const pendingBundle = ref<Record<string, unknown> | null>(null);
const preview = ref<ImportCounts | null>(null);
const importing = ref(false);
const importResult = ref<ImportCounts | null>(null);

async function onJsonFileChange(e: Event) {
  error.value = "";
  importResult.value = null;
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const bundle = JSON.parse(text) as Record<string, unknown>;
    pendingBundle.value = bundle;
    preview.value = await apiFetch<ImportCounts>("/api/import/preview", { method: "POST", body: { bundle } });
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "File JSON tidak valid.";
    pendingBundle.value = null;
    preview.value = null;
  }
}

async function onConfirmImport() {
  if (!pendingBundle.value) return;
  importing.value = true;
  error.value = "";
  try {
    importResult.value = await apiFetch<ImportCounts>("/api/import", { method: "POST", body: { bundle: pendingBundle.value } });
    pendingBundle.value = null;
    preview.value = null;
    if (jsonFileInput.value) jsonFileInput.value.value = "";
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal import.";
  } finally {
    importing.value = false;
  }
}

const wxrFileInput = ref<HTMLInputElement | null>(null);
const wxrImporting = ref(false);
const wxrResult = ref<ImportCounts | null>(null);

async function onWxrFileChange(e: Event) {
  error.value = "";
  wxrResult.value = null;
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const xml = await file.text();
  wxrImporting.value = true;
  try {
    wxrResult.value = await apiFetch<ImportCounts>("/api/import/wxr", { method: "POST", body: { xml } });
    if (wxrFileInput.value) wxrFileInput.value.value = "";
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal import WXR.";
  } finally {
    wxrImporting.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="Import / Export" description="Backup/restore data situs sebagai JSON, atau import dari export WordPress (WXR)." />

    <p v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</p>

    <div class="max-w-2xl space-y-4">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Export</h2>
        </template>
        <p class="text-sm text-slate-500 mb-3">
          Unduh seluruh content, kategori/tag, metadata media, dan comment sebagai satu file JSON. Cakupan v1: metadata +
          path media saja, TIDAK membundel file binary media itu sendiri.
        </p>
        <UButton :loading="exporting" icon="i-lucide-download" @click="onExport">Export sebagai JSON</UButton>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Import JSON</h2>
        </template>
        <p class="text-sm text-slate-500 mb-3">
          Content yang slug-nya sudah ada akan DI-SKIP (bukan diduplikat) — aman di-import ulang berkali-kali.
        </p>
        <input ref="jsonFileInput" type="file" accept="application/json" class="text-sm mb-3" @change="onJsonFileChange">

        <div v-if="preview" class="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm mb-3 space-y-1">
          <p>{{ preview.content.total }} content ditemukan — {{ preview.content.toCreate }} akan dibuat, {{ preview.content.toSkip }} akan di-skip (slug sudah ada)</p>
          <p>{{ preview.terms.total }} kategori/tag, {{ preview.media.total }} media, {{ preview.comments.total }} comment</p>
        </div>
        <UButton v-if="preview" :loading="importing" color="success" icon="i-lucide-check" @click="onConfirmImport">
          Konfirmasi Import
        </UButton>

        <div v-if="importResult" class="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm mt-3 space-y-1 text-green-800 dark:text-green-300">
          <p>Content: {{ importResult.content.created }} dibuat, {{ importResult.content.skipped }} di-skip</p>
          <p>Terms: {{ importResult.terms.created }} dibuat, {{ importResult.terms.skipped }} di-skip</p>
          <p>Media: {{ importResult.media.created }} dibuat</p>
          <p>Comments: {{ importResult.comments.created }} dibuat, {{ importResult.comments.skipped }} di-skip</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Import WXR (WordPress export)</h2>
        </template>
        <p class="text-sm text-slate-500 mb-3">
          Best-effort dan LOSSY secara sengaja: cuma post/page (draft/publish) yang diimport, isi HTML dikonversi naif ke
          paragraph/heading block, hierarki kategori WXR, featured-image attachment, postmeta, dan author mapping
          TIDAK dipertahankan — cuma nama kategori/tag yang ikut.
        </p>
        <input ref="wxrFileInput" type="file" accept=".xml" class="text-sm" @change="onWxrFileChange">

        <div v-if="wxrImporting" class="text-sm text-slate-400 mt-3">Mengimport...</div>
        <div v-if="wxrResult" class="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm mt-3 space-y-1 text-green-800 dark:text-green-300">
          <p>Content: {{ wxrResult.content.created }} dibuat, {{ wxrResult.content.skipped }} di-skip</p>
          <p>Terms: {{ wxrResult.terms.created }} dibuat, {{ wxrResult.terms.skipped }} di-skip</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
