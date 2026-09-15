<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface AccountInfo {
  id: string;
  email: string;
  displayName: string;
  totpEnabled: boolean;
}

const { data: account, refresh } = await useApiFetch<AccountInfo>("/api/account");

const setupStep = ref<"idle" | "scanning" | "recovery-codes">("idle");
const qrDataUrl = ref("");
const verifyCode = ref("");
const recoveryCodes = ref<string[]>([]);
const disablePassword = ref("");
const error = ref("");
const busy = ref(false);

async function onStartSetup() {
  error.value = "";
  busy.value = true;
  try {
    const result = await apiFetch<{ secret: string; qrDataUrl: string }>("/api/account/totp/setup", { method: "POST" });
    qrDataUrl.value = result.qrDataUrl;
    setupStep.value = "scanning";
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal memulai setup.";
  } finally {
    busy.value = false;
  }
}

async function onConfirmSetup() {
  error.value = "";
  busy.value = true;
  try {
    const result = await apiFetch<{ recoveryCodes: string[] }>("/api/account/totp/verify-setup", {
      method: "POST",
      body: { code: verifyCode.value }
    });
    recoveryCodes.value = result.recoveryCodes;
    setupStep.value = "recovery-codes";
    verifyCode.value = "";
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Kode tidak valid.";
  } finally {
    busy.value = false;
  }
}

async function onDisable() {
  error.value = "";
  busy.value = true;
  try {
    await apiFetch("/api/account/totp/disable", { method: "POST", body: { password: disablePassword.value } });
    disablePassword.value = "";
    setupStep.value = "idle";
    await refresh();
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Gagal menonaktifkan.";
  } finally {
    busy.value = false;
  }
}

function onFinishSetup() {
  setupStep.value = "idle";
  recoveryCodes.value = [];
}
</script>

<template>
  <div>
    <PageHeader title="Akun Saya" description="Kelola keamanan akun Anda sendiri." />

    <div class="max-w-lg space-y-4">
      <UAlert v-if="error" color="error" variant="subtle" :title="error" />

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Profil</h2>
        </template>
        <p class="text-sm text-slate-500">{{ account?.displayName }} — {{ account?.email }}</p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">Two-Factor Authentication (TOTP)</h2>
        </template>

        <div v-if="setupStep === 'idle' && !account?.totpEnabled">
          <p class="text-sm text-slate-500 mb-3">Belum aktif. Tambahkan lapisan keamanan ekstra dengan aplikasi authenticator.</p>
          <UButton :loading="busy" icon="i-lucide-shield-check" @click="onStartSetup">Aktifkan 2FA</UButton>
        </div>

        <div v-else-if="setupStep === 'scanning'">
          <p class="text-sm text-slate-500 mb-3">Scan QR ini dengan aplikasi authenticator (Google Authenticator, Authy, dst), lalu masukkan kode 6 digit yang muncul.</p>
          <img :src="qrDataUrl" alt="QR TOTP" class="size-48 mb-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <UFormField label="Kode verifikasi">
            <UInput v-model="verifyCode" inputmode="numeric" placeholder="123456" class="w-48" />
          </UFormField>
          <UButton class="mt-3" :loading="busy" @click="onConfirmSetup">Konfirmasi & Aktifkan</UButton>
        </div>

        <div v-else-if="setupStep === 'recovery-codes'">
          <UAlert
            color="warning"
            variant="subtle"
            title="Simpan recovery code ini sekarang"
            description="Setiap code hanya bisa dipakai SEKALI dan hanya ditampilkan sekali ini saja -- dipakai kalau Anda kehilangan akses ke aplikasi authenticator."
            class="mb-3"
          />
          <div class="grid grid-cols-2 gap-2 font-mono text-sm bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4">
            <span v-for="code in recoveryCodes" :key="code">{{ code }}</span>
          </div>
          <UButton @click="onFinishSetup">Selesai, sudah disimpan</UButton>
        </div>

        <div v-else>
          <p class="text-sm text-green-600 mb-3">2FA aktif untuk akun ini.</p>
          <UFormField label="Masukkan password untuk menonaktifkan">
            <UInput v-model="disablePassword" type="password" class="w-full max-w-xs" />
          </UFormField>
          <UButton class="mt-3" color="error" variant="outline" :loading="busy" @click="onDisable">Nonaktifkan 2FA</UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
