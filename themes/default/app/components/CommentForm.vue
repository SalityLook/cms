<script setup lang="ts">
const props = defineProps<{ contentId: string; parentId?: string | null }>();
const emit = defineEmits<{ submitted: [] }>();

const authorName = ref("");
const authorEmail = ref("");
const body = ref("");
const submitting = ref(false);
const error = ref("");
const success = ref(false);

async function onSubmit() {
  error.value = "";
  submitting.value = true;
  try {
    await $fetch("/api/comments", {
      method: "POST",
      body: {
        contentId: props.contentId,
        parentId: props.parentId ?? null,
        authorName: authorName.value,
        authorEmail: authorEmail.value,
        body: body.value
      }
    });
    authorName.value = "";
    authorEmail.value = "";
    body.value = "";
    success.value = true;
    emit("submitted");
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal mengirim komentar.";
  } finally {
    submitting.value = false;
  }
}

const inputClass =
  "w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
</script>

<template>
  <form class="space-y-3" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input v-model="authorName" type="text" placeholder="Nama" required :class="inputClass">
      <input v-model="authorEmail" type="email" placeholder="Email" required :class="inputClass">
    </div>
    <textarea v-model="body" placeholder="Tulis komentar..." required rows="3" :class="inputClass" />

    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    <p v-if="success" class="text-sm text-green-600">Komentar terkirim, menunggu moderasi sebelum tampil.</p>

    <button
      type="submit"
      :disabled="submitting"
      class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
    >
      {{ submitting ? "Mengirim..." : "Kirim Komentar" }}
    </button>
  </form>
</template>
