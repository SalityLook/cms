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

interface ApiKeySummary {
  id: string;
  label: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

const { data: apiKeys, refresh: refreshApiKeys } = await useApiFetch<ApiKeySummary[]>("/api/account/api-keys");
const newKeyLabel = ref("");
const revealedKey = ref("");
const apiKeyBusy = ref(false);

async function onCreateApiKey() {
  if (!newKeyLabel.value.trim()) return;
  apiKeyBusy.value = true;
  try {
    const result = await apiFetch<{ id: string; rawKey: string }>("/api/account/api-keys", {
      method: "POST",
      body: { label: newKeyLabel.value.trim() }
    });
    revealedKey.value = result.rawKey;
    newKeyLabel.value = "";
    await refreshApiKeys();
  } finally {
    apiKeyBusy.value = false;
  }
}

async function onRevokeApiKey(id: string) {
  await apiFetch(`/api/account/api-keys/${id}/revoke`, { method: "POST" });
  await refreshApiKeys();
}

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

      <UCard>
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-white text-sm">API Keys</h2>
        </template>
        <p class="text-sm text-slate-500 mb-3">
          Untuk integrasi eksternal ke <code>GET /api/v1/*</code> (baca konten published) dan
          <code>POST /api/v1/comments</code> (comment terautentikasi, diatribusi ke Anda). Lihat <code>docs/api.md</code>.
        </p>

        <UAlert
          v-if="revealedKey"
          color="warning"
          variant="subtle"
          title="Simpan key ini sekarang -- tidak akan ditampilkan lagi"
          class="mb-4"
        >
          <template #description>
            <code class="block break-all bg-slate-100 dark:bg-slate-800 rounded p-2 mt-2 text-xs">{{ revealedKey }}</code>
          </template>
        </UAlert>

        <div class="flex gap-2 mb-4">
          <UInput v-model="newKeyLabel" placeholder="Label (mis. 'Build script')" class="flex-1" />
          <UButton :loading="apiKeyBusy" @click="onCreateApiKey">Buat Key</UButton>
        </div>

        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="key in apiKeys" :key="key.id" class="py-2.5 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ key.label }}</p>
              <p class="text-xs text-slate-400">
                {{ key.revokedAt ? "Revoked" : key.lastUsedAt ? `Terakhir dipakai: ${new Date(key.lastUsedAt).toLocaleString()}` : "Belum pernah dipakai" }}
              </p>
            </div>
            <UButton v-if="!key.revokedAt" size="xs" variant="ghost" color="error" @click="onRevokeApiKey(key.id)">Revoke</UButton>
          </li>
          <li v-if="!apiKeys?.length" class="py-4 text-center text-slate-400 text-sm">Belum ada API key.</li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
