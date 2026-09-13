<script setup lang="ts">
import { onMounted, ref } from "vue";

/**
 * Deliberately uses plain HTML + Tailwind instead of the host's Nuxt UI
 * components, and the global $fetch (not the admin app's apiFetch/useApiFetch
 * helpers) — a real third-party plugin component shouldn't have to assume
 * either is available. Registered onto AdminUIRegistry.registerEditorPanel()
 * for content type "post" by apps/admin/app/plugins/load-plugins.ts.
 */
const props = defineProps<{ contentId: string }>();

const note = ref("");
const saving = ref(false);
const loaded = ref(false);

onMounted(async () => {
  const data = await $fetch<Record<string, unknown>>(`/api/posts/${props.contentId}/meta`);
  note.value = typeof data.exampleNote === "string" ? data.exampleNote : "";
  loaded.value = true;
});

async function onSave() {
  saving.value = true;
  await $fetch(`/api/posts/${props.contentId}/meta`, {
    method: "PUT",
    body: { key: "exampleNote", value: note.value }
  });
  saving.value = false;
}
</script>

<template>
  <div class="space-y-2">
    <h3 class="font-medium text-sm">Example Plugin Panel</h3>
    <p class="text-xs text-gray-400">
      Didaftarkan oleh plugins/example-plugin lewat AdminUIRegistry.registerEditorPanel(); data tersimpan di
      tabel content_meta.
    </p>
    <textarea
      v-model="note"
      class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-transparent"
      rows="2"
      placeholder="Catatan dari example-plugin..."
      :disabled="!loaded"
    />
    <button
      type="button"
      class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-50"
      :disabled="saving"
      @click="onSave"
    >
      {{ saving ? "Menyimpan..." : "Simpan Catatan" }}
    </button>
  </div>
</template>
