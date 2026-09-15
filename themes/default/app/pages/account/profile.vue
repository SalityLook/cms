<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface ProfileResponse {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  slug: string | null;
}

const { clear } = useUserSession();
const { data: profile, refresh } = await useFetch<ProfileResponse>("/api/account/profile");

const displayName = ref(profile.value?.displayName ?? "");
const bio = ref(profile.value?.bio ?? "");
const saving = ref(false);
const error = ref("");
const saved = ref(false);

const inputClass =
  "w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

async function onSave() {
  error.value = "";
  saved.value = false;
  saving.value = true;
  try {
    await $fetch("/api/account/profile", { method: "PUT", body: { displayName: displayName.value, bio: bio.value || null } });
    await refresh();
    saved.value = true;
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menyimpan.";
  } finally {
    saving.value = false;
  }
}

async function onLogout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-16 sm:py-24">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-serif text-2xl font-semibold text-slate-900 dark:text-white">Profil Saya</h1>
      <button type="button" class="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white" @click="onLogout">Keluar</button>
    </div>

    <form class="space-y-3" @submit.prevent="onSave">
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Email</label>
        <p class="text-sm text-slate-900 dark:text-white">{{ profile?.email }}</p>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Nama</label>
        <input v-model="displayName" type="text" :class="inputClass">
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Bio</label>
        <textarea v-model="bio" rows="4" :class="inputClass" />
      </div>
      <div v-if="profile?.slug" class="text-xs text-slate-400">
        Halaman publik: <NuxtLink :to="`/author/${profile.slug}`" class="underline">/author/{{ profile.slug }}</NuxtLink>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      <p v-if="saved" class="text-sm text-green-600">Tersimpan.</p>

      <button
        type="submit"
        :disabled="saving"
        class="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {{ saving ? "Menyimpan..." : "Simpan" }}
      </button>
    </form>
  </div>
</template>
