# SelfTaught CMS

CMS modern terinspirasi WordPress — blog, pages, categories, tags, media,
roles & permission, SEO, revision history, publishing workflow, dan
extensibility lewat theme & plugin — dibangun native di atas **Nuxt 4 + Vue 3
+ TypeScript + Tailwind CSS v4 + PostgreSQL (Drizzle ORM)**.

Bukan clone WordPress 1:1. Prinsipnya: ambil pola-pola WordPress yang sudah
terbukti (role sebagai kumpulan capability, custom fields via EAV, revision
snapshot, hook system) tapi diimplementasikan dengan primitif Nuxt modern
(Nitro server routes, Nuxt Layers untuk theme, block editor berbasis
ProseMirror, TypeScript end-to-end).

## Fitur

- **UI modern & responsif** — admin dashboard dengan sidebar navigasi
  (desktop) / drawer (mobile), block editor dengan toolbar formatting
  penuh, dan situs publik dengan tampilan blog editorial (hero, kartu
  post, tipografi serif untuk judul) — semua dibangun di atas font
  self-hosted (Inter/Lora) dan satu design token bersama
  (`packages/tailwind-config`)
- **Branding per-instalasi** — ganti logo, favicon, dan nama situs sendiri
  lewat `/settings` (Site Identity), tanpa sentuh kode — "SelfTaught" cuma
  identitas bawaan proyek ini, sama seperti WordPress; cocok dipakai
  masing-masing sekolah/organisasi dengan identitas sendiri per instalasi
- **Content management** — post & **page** (dengan hierarki parent/menu
  order) pakai block editor bergaya Gutenberg (Tiptap),
  draft/pending review/scheduled/published/trashed dengan auto-publish via
  cron, dan full revision history (setiap perubahan tersimpan, bisa dipulihkan)
- **Taxonomy & media** — categories, tags, media library dengan upload gambar
  (ekstraksi dimensi otomatis via `sharp`)
- **RBAC** — role & capability granular (`admin`, `editor`, `author`,
  `contributor` bawaan), enforcement dua lapis (API layer + service layer),
  lengkap dengan halaman admin `/users` & `/roles` untuk kelola user dan
  lihat capability per role
- **Automated tests** — `vitest` (unit test murni + integration test
  terhadap Postgres asli, `pnpm test`)
- **SEO** — meta title/description/canonical/OG image per-halaman dengan
  fallback ke default situs, JSON-LD structured data, `sitemap.xml` &
  `robots.txt` otomatis
- **Theme layer** — tampilan publik adalah Nuxt Layer yang bisa diganti
  sepenuhnya tanpa menyentuh kode aplikasi
- **Hook & plugin system** — `HookBus` (action/filter ala WordPress) dan
  registry yang bisa di-extend plugin (content type, taxonomy, capability),
  lengkap dengan contoh plugin yang benar-benar berfungsi
  (`plugins/example-plugin`)
- **Production hardening** — rate limiting login (per-IP & per-email),
  validasi tipe/ukuran file upload, HTTP status code presisi untuk error
  domain (400/403/404/409, bukan 500 generik), dependency audit bersih dari
  celah kritis/high, CI (lint/typecheck/test/build/audit), dan tooling
  backup/restore + reset password darurat

## Tech stack

| Bagian | Teknologi |
|---|---|
| Framework | Nuxt 4 (admin + frontend, app terpisah) |
| Bahasa | TypeScript end-to-end |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (session cookie) |
| Editor | [Tiptap](https://tiptap.dev/) (ProseMirror) — konten tersimpan sebagai block JSON |
| UI admin | [Nuxt UI v3](https://ui.nuxt.com/) (Tailwind v4) |
| Styling | Tailwind CSS v4 |
| Monorepo | pnpm workspaces |
| Deployment | Node self-hosted (Nitro `node-server`) / Docker |

## Struktur monorepo

```
selftaught/
├── apps/
│   ├── admin/          # Dashboard admin (Nuxt 4) — port 3000
│   └── frontend/       # Situs publik (Nuxt 4, tipis, extends theme) — port 3001
├── packages/
│   ├── core/           # @selftaught/core — domain logic, DB schema, services, hooks, registry
│   ├── blocks/         # @selftaught/blocks — block editor render engine
│   ├── tailwind-config/# Token desain Tailwind bersama
│   └── ui/             # (kosong, opsional untuk komponen bersama nanti)
├── themes/
│   └── default/        # @selftaught/theme-default — Nuxt Layer, tampilan publik default
└── plugins/
    └── example-plugin/ # Contoh plugin: capability baru + hook + panel editor
```

Detail arsitektur lengkap (keputusan desain, skema database, daftar gotcha
teknis yang sudah pernah ditemukan) ada di [`CLAUDE.md`](./CLAUDE.md) — baca
itu sebelum melakukan perubahan besar pada kode.

## Prasyarat

- **Node.js ≥ 20** (disarankan Node 22 LTS)
- **pnpm** (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL 13+** (native install atau Docker — `gen_random_uuid()` butuh
  Postgres 13+ atau extension `pgcrypto` di versi lebih lama)

## Mulai cepat (development lokal)

```bash
# 1. Clone & install dependencies
git clone https://github.com/SalityLook/cms.git selftaught
cd selftaught
pnpm install

# 2. Siapkan database Postgres — pilih salah satu:
#    a) Postgres native yang sudah terinstall:
sudo -u postgres psql -c "CREATE DATABASE selftaught;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
# kalau Postgres < 13, aktifkan extension ini dulu:
sudo -u postgres psql -d selftaught -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
#    b) atau, kalau punya Docker, cukup jalankan service postgres-nya saja:
docker compose up -d postgres

# 3. Konfigurasi environment
cp .env.example .env
# lalu edit .env: isi NUXT_SESSION_PASSWORD dengan string acak
#   openssl rand -hex 24

# 4. Migrasi & seed database
pnpm db:migrate
pnpm db:seed

# 5. Jalankan dev server (di dua terminal terpisah)
pnpm dev:admin       # → http://localhost:3000  (dashboard)
pnpm dev:frontend    # → http://localhost:3001  (situs publik)
```

Login ke dashboard admin dengan kredensial hasil seed (lihat di bawah), buat
post pertama, publish, dan langsung terlihat di `http://localhost:3001/blog`.

> **Catatan pnpm**: saat `pnpm install` pertama kali, pnpm akan minta approve
> beberapa build script native (`argon2`, `esbuild`, `sharp`, dst). Ini normal
> dan sudah di-allowlist di `pnpm-workspace.yaml` — kalau muncul prompt baru
> yang belum ter-allowlist, cek dulu package-nya sebelum approve.

### Kredensial admin default (dari seed)

```
Email:    admin@example.com
Password: changeme123!
```

**Ganti password ini setelah login pertama** kalau bukan untuk development
lokal. Untuk mengganti kredensial seed itu sendiri, set env `ADMIN_EMAIL` dan
`ADMIN_PASSWORD` sebelum menjalankan `pnpm db:seed`.

## Environment variables

Semua diisi di file `.env` pada root repo (bukan di dalam `apps/*`).

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Postgres, contoh: `postgres://postgres:postgres@localhost:5432/selftaught` |
| `NUXT_SESSION_PASSWORD` | Secret untuk enkripsi session cookie — **wajib** string acak ≥32 karakter (`openssl rand -hex 24`) |
| `MEDIA_STORAGE_DRIVER` | `local` (default) — driver penyimpanan media |
| `MEDIA_LOCAL_PATH` | Path folder upload, relatif ke `apps/admin`/`apps/frontend` (default `../../data/media`, **jangan diubah** ke path yang tidak sama-sama diakses kedua app) |
| `NUXT_PUBLIC_SITE_URL` | URL publik situs (dipakai untuk `sitemap.xml`, canonical URL, dll) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | (opsional, saat `pnpm db:seed`) override kredensial admin default |

## Perintah yang tersedia

```bash
# Development
pnpm dev:admin              # Dashboard admin — http://localhost:3000
pnpm dev:frontend           # Situs publik — http://localhost:3001

# Build produksi
pnpm build:admin
pnpm build:frontend

# Database (Drizzle ORM, target packages/core)
pnpm db:generate            # Generate migration baru dari perubahan schema
pnpm db:migrate             # Terapkan migration ke database
pnpm db:seed                # Seed capability, role bawaan, dan user admin pertama
pnpm db:studio              # Buka Drizzle Studio (GUI browser database)

# Quality gates
pnpm typecheck              # Typecheck seluruh package/app
pnpm lint                   # Lint seluruh package/app
pnpm test                   # Unit test + integration test (butuh db:migrate + db:seed dulu)
```

## Deployment produksi

> **Live**: https://self-taught.my.id (publik) / https://admin.self-taught.my.id
> (dashboard). Deployment ini di VPS **tanpa Docker**, jadi dijalankan lewat
> jalur native — build Nitro biasa + [pm2](https://pm2.keymetrics.io/) +
> nginx reverse proxy + certbot, BUKAN `docker-compose.yml` di bawah ini.
> Detail lengkap (script start, config nginx, cara TLS diterbitkan, backup
> cron) ada di `CLAUDE.md` bagian "Pekerjaan pasca-roadmap #5". Kalau VPS
> Anda punya Docker, panduan `docker-compose.yml` di bawah tetap jalur yang
> lebih simpel.

Repo ini sudah menyediakan `Dockerfile` dan `docker-compose.yml` untuk
deployment self-hosted:

```bash
cp .env.example .env   # isi dengan nilai produksi (secret yang kuat, dst)
docker compose up -d --build
```

`docker-compose.yml` menjalankan PostgreSQL 16 + app `admin` (port 3000) +
app `frontend` (port 3001), dengan volume bersama untuk `data/media` supaya
file upload konsisten antara kedua app.

Image runtime `admin`/`frontend` cuma berisi hasil build (`.output/`), tanpa
pnpm/source code — jadi migrasi & seed **tidak** dijalankan lewat
`docker compose exec`, melainkan dari host yang punya pnpm + source (mis.
server tempat repo ini di-clone), menunjuk ke Postgres container lewat port
5432 yang sudah dipetakan ke host oleh `docker-compose.yml`:

```bash
pnpm db:migrate
pnpm db:seed
```

`DATABASE_URL` di `.env` (dipakai kedua perintah di atas via host) memang
harus `localhost:5432`, berbeda dari `DATABASE_URL` yang dipakai container
`admin`/`frontend` sendiri (`postgres:5432`, di-override lewat blok
`environment:` di `docker-compose.yml`, hostname `postgres` = nama service
Compose) — jangan disamakan, keduanya sudah benar seperti apa adanya. Jalankan
`pnpm db:migrate` sekali di awal deployment, lalu ulangi (tanpa `db:seed`)
tiap kali ada migration baru setelah `git pull` + `docker compose up -d --build`.

Di belakang app ini biasanya dipasang reverse proxy (Nginx/Caddy) dengan
TLS — arahkan domain admin (mis. `admin.namadomain.com`) ke port 3000 dan
domain publik ke port 3001.

> **Upload media**: API upload membatasi ukuran file ke 10MB di level
> aplikasi (lihat `MAX_FILE_SIZE_BYTES` di
> `packages/core/src/domain/media/media-service.ts`). Kalau reverse proxy di
> depannya punya limit body size sendiri yang lebih kecil (default Nginx
> `client_max_body_size` cuma 1MB), naikkan juga di config proxy-nya, mis.
> untuk Nginx: `client_max_body_size 11m;` pada block yang mem-proxy ke
> port admin.

### CI

`.github/workflows/ci.yml` menjalankan lint, typecheck, test suite, build
`admin`+`frontend`, dan `pnpm audit --audit-level=high` pada tiap push/PR ke
`master`/`main`, dengan Postgres 16 sebagai service container. Gunakan ini
sebagai gate sebelum merge — semua langkah itu juga bisa dijalankan manual
secara lokal dengan perintah yang sama (lihat "Perintah yang tersedia" di
atas).

## Backup & restore

Database Postgres adalah satu-satunya sumber kebenaran untuk semua konten,
user, dan pengaturan; folder `data/media` (lihat `MEDIA_LOCAL_PATH`) berisi
file upload asli yang tidak ada di database. Keduanya harus di-backup
bersamaan.

```bash
# Backup (dump DB + arsip folder media, timestamped, default ke ./backups)
./scripts/backup.sh
# atau tentukan folder output sendiri:
./scripts/backup.sh /path/ke/folder/backup

# Restore (menimpa database & media saat ini — dipakai untuk disaster
# recovery atau pindah server, bukan operasi rutin)
./scripts/restore.sh backups/db-20260101-000000.sql.gz backups/media-20260101-000000.tar.gz
```

Kedua script membaca `DATABASE_URL`/`MEDIA_LOCAL_PATH` dari `.env` di root,
sama seperti perintah `pnpm db:*` lainnya. Jadwalkan `scripts/backup.sh`
lewat cron di server produksi (mis. tiap malam) dan salin hasilnya ke
penyimpanan terpisah dari server yang sama (disk lain, object storage, dll)
— backup yang hanya tersimpan di server yang sama tidak melindungi dari
kegagalan disk/server itu sendiri.

## Reset password admin

Kalau admin lupa password tapi masih bisa login sebagai admin lain, pakai
halaman `/users/[id]` → bagian "Reset Password" (butuh capability
`manage_users`). Kalau **tidak ada** admin yang bisa login sama sekali,
reset langsung lewat database via CLI:

```bash
pnpm reset-password admin@example.com passwordBaruMinimal8Karakter
```

Perintah ini bicara langsung ke database (`packages/core/src/db/reset-password.ts`),
tidak lewat API, jadi tetap bisa dipakai walau seluruh app down — asal
`DATABASE_URL` di `.env` benar dan Postgres reachable.

## Mengembangkan theme

Tampilan publik adalah **Nuxt Layer** di `themes/default/`. Untuk membuat
theme baru:

1. Duplikat `themes/default/` menjadi `themes/nama-theme-baru/` (termasuk
   `package.json`-nya sendiri — theme harus jadi pnpm workspace package,
   lihat `CLAUDE.md` Gotcha #15 untuk alasan teknisnya)
2. Ubah `app/pages/`, `app/app.vue`, `app/assets/css/main.css` sesuai desain
   yang diinginkan
3. Ganti satu baris di `apps/frontend/nuxt.config.ts`:
   ```ts
   extends: ["../../themes/nama-theme-baru"]
   ```
4. `pnpm install` lagi supaya theme baru terdaftar sebagai workspace package,
   lalu `pnpm dev:frontend`

## Mengembangkan plugin

Lihat `plugins/example-plugin/` sebagai referensi. Struktur minimal:

```ts
// plugins/nama-plugin/src/server.ts
import { definePlugin } from "@selftaught/core/server";

export default definePlugin({
  id: "nama-plugin",
  setup(ctx) {
    ctx.capabilities.register({ key: "nama_plugin_capability" });
    ctx.hooks.onAction("content:published", ({ content }) => {
      // reaksi custom saat konten dipublikasikan
    });
  }
});
```

Daftarkan plugin di `apps/admin/plugins.config.ts`:

```ts
import namaPlugin from "@selftaught/nama-plugin/server";
export const plugins = [namaPlugin /* , ...plugin lain */];
```

Kalau plugin punya komponen UI (panel di editor post, dll), lihat
`plugins/example-plugin/src/EditorPanel.vue` dan
`apps/admin/app/plugins/load-plugins.ts` sebagai contoh cara mendaftarkannya
ke `AdminUIRegistry`.

## Dokumentasi lanjutan

- [`CLAUDE.md`](./CLAUDE.md) — ringkasan arsitektur lengkap, status tiap fase
  pengembangan, daftar gotcha teknis yang sudah pernah ditemukan (baca ini
  dulu sebelum debugging masalah build/typecheck/SSR yang aneh), dan daftar
  fitur yang sengaja belum diimplementasikan beserta cara melanjutkannya.

## Status proyek

Semua 8 fase roadmap awal (scaffolding, auth/RBAC, content & block editor,
taxonomy & media, revisions & publishing workflow, SEO, theme layer, hook/
plugin system) sudah selesai, ditambah lima penyempurnaan pasca-roadmap:
halaman admin Users & Roles, automated test suite, CRUD penuh untuk content
type "page" (termasuk hierarki parent/menu order), production hardening
(rate limiting, validasi upload, status code presisi, dependency audit,
CI, backup/restore), dan **deployment produksi live** di
https://self-taught.my.id. Beberapa item kecil masih sengaja belum dibangun
(static front page homepage, pembuatan role custom lewat UI, dsb.) — daftar
lengkap beserta cara melanjutkannya ada di bagian akhir `CLAUDE.md`.
