# SelfTaught CMS

Modern CMS terinspirasi WordPress (blog, pages, categories, tags, media, roles,
SEO, revisions, publishing workflow, theme/plugin extensibility) tapi dibangun
native di ekosistem Nuxt/Vue + TypeScript + Tailwind — **bukan clone 100%**.
Prinsip: ambil pola terbukti WordPress (roles-as-capability-bundles, EAV
postmeta, full-snapshot revisions, hook system) tapi diimplementasikan dengan
primitif Nuxt modern (Nitro server routes, Nuxt Layers untuk theme,
TypeScript end-to-end).

Rencana arsitektur lengkap (semua fase, semua keputusan desain, semua schema)
ada di `/root/.claude/plans/saya-ingin-membangun-sebuah-tingly-spring.md`.
Dokumen ini (`CLAUDE.md`) adalah ringkasan operasional + status terkini +
gotcha yang sudah ditemukan, supaya pekerjaan bisa lanjut tanpa internet dan
tanpa perlu re-derive keputusan yang sudah diambil.

## Keputusan arsitektur (final, jangan diubah tanpa alasan kuat)

1. **Database/ORM**: PostgreSQL + Drizzle ORM
2. **Struktur project**: Monorepo pnpm workspaces (`packages/*`, `apps/*`, `themes/*`, `plugins/*`)
3. **Editor**: Block editor bergaya Gutenberg di atas Tiptap/ProseMirror — konten
   disimpan **langsung** sebagai ProseMirror-compatible JSON (`content.content` jsonb),
   tidak ada layer transform terpisah
4. **Deployment**: Self-hosted Node/Docker (Nitro `node-server` preset), media di
   local disk via `StorageAdapter` (bisa diganti S3 nanti)
5. **Auth**: `nuxt-auth-utils` (session cookie, bukan Lucia/better-auth — RBAC kita
   bespoke jadi tidak perlu framework auth berat)
6. **UI kit**: `@nuxt/ui` v3 (Tailwind v4-based) untuk admin saja; frontend pakai
   Tailwind polos supaya theme tidak terkunci ke komponen admin-oriented

## Status implementasi

- ✅ **Phase 0 — Scaffolding** (commit `1954957`)
- ✅ **Phase 1 — Core schema + auth + RBAC** (commit `86e992e`)
- ✅ **Phase 2 — Content CRUD + block editor**
- ✅ **Phase 3 — Taxonomies + media**
- ✅ **Phase 4 — Revisions + full publishing workflow** (lihat bagian di bawah)
- ⬜ Phase 5 — SEO subsystem (**berikutnya**)
- ⬜ Phase 6 — Frontend polish + theme layer
- ⬜ Phase 7 — Hook/plugin system + example plugin

Detail lengkap tiap fase (deliverable, file yang harus dibuat) ada di bagian
"Phased Build Roadmap" pada plan file yang disebut di atas. Jangan ulangi riset
arsitektur — tinggal eksekusi sesuai urutan itu.

## Struktur monorepo saat ini

```
selftaught/
├── packages/
│   ├── core/                    # @selftaught/core — domain logic, DB, services, hooks
│   │   ├── src/db/schema/users.ts       # users, roles, capabilities, role_capabilities, user_roles, sessions
│   │   ├── src/db/client.ts             # drizzle(postgres) — export `db`
│   │   ├── src/db/migrate.ts, seed.ts
│   │   ├── src/domain/users/            # UserService, RoleService, PermissionService
│   │   ├── src/registry/capabilities.ts # CAPABILITIES const + SYSTEM_ROLES (admin/editor/author/contributor)
│   │   ├── src/auth/password.ts         # argon2 hash/verify
│   │   ├── src/shared/                  # types.ts (AuthUser/Actor), auth-schemas.ts (zod loginSchema)
│   │   ├── src/server.ts                # server-only barrel + singleton services (userService, roleService, permissionService)
│   │   └── src/shared/index.ts          # client-safe barrel (import from "@selftaught/core")
│   ├── blocks/                  # @selftaught/blocks — render side dari block editor
│   │   ├── src/schema.ts                # re-export BlockNode/ContentDocument dari @selftaught/core (lihat catatan di bawah)
│   │   ├── src/registry.ts              # BlockRegistry — map node.type -> Vue render component
│   │   ├── src/default-blocks.ts        # registrasi block bawaan (side-effect import)
│   │   ├── src/render/BlockRenderer.vue # komponen rekursif utama (dipakai frontend)
│   │   ├── src/render/{Paragraph,Heading,BulletList,OrderedList,ListItem,Blockquote,CodeBlock,Image,HardBreak,HorizontalRule}.vue
│   │   ├── src/render/{MarkWrap,MarkText}.vue  # inline marks (bold/italic/code/strike/link), nested via rekursi
│   │   └── src/shims.d.ts               # `declare module "*.vue"` supaya `tsc`/`vue-tsc` standalone jalan
│   ├── tailwind-config/         # shared Tailwind v4 theme.css tokens
│   └── ui/                      # kosong, opsional (v1-light)
├── apps/
│   ├── admin/                   # Nuxt 4, port 3000 — dashboard
│   │   ├── app/pages/login.vue, index.vue (dashboard shell, protected)
│   │   ├── app/pages/posts/{index,new,[id]}.vue  # list, create, edit+publish/unpublish/delete
│   │   ├── app/components/BlockEditor.vue        # Tiptap (@tiptap/vue-3 + starter-kit + image) v-model ContentDocument
│   │   ├── app/middleware/auth.ts       # redirect ke /login kalau !loggedIn
│   │   ├── server/api/auth/{login,logout,me}.{post,get}.ts
│   │   ├── server/api/posts/{index,[id]}.{get,post,patch,delete}.ts + [id]/{publish,unpublish}.post.ts
│   │   ├── server/middleware/auth.ts    # resolve Actor fresh dari DB per /api/* request
│   │   ├── server/utils/require-capability.ts
│   │   └── shared/types/auth.d.ts       # augment #auth-utils User type (WAJIB di shared/, lihat Gotcha #3)
│   │   ├── app/pages/{media,categories,tags,trash}.vue  # media library + taxonomy CRUD + trash
│   │   ├── app/components/TaxonomyManager.vue     # shared component for categories.vue/tags.vue
│   │   ├── app/utils/api.ts                       # apiFetch/useApiFetch — MANDATORY, see Gotcha #13
│   │   ├── server/api/media/{index,[id]}.{get,post,delete}.ts
│   │   ├── server/api/taxonomy/[taxonomy]/{index,[id]}.{get,post,delete}.ts
│   │   ├── server/api/posts/[id]/{submit,schedule,trash,untrash}.post.ts
│   │   ├── server/api/posts/[id]/revisions/index.get.ts + [revisionId]/restore.post.ts
│   │   ├── server/tasks/content/publish-scheduled.ts  # Nitro cron, "* * * * *"
│   │   └── server/routes/media/[...path].get.ts   # serves uploaded files from MEDIA_LOCAL_PATH
│   └── frontend/                # Nuxt 4, port 3001 — public site, extends themes/default
│       ├── app/pages/index.vue, blog/{index,[slug]}.vue, category/[slug].vue, tag/[slug].vue
│       ├── server/api/posts/{index,[slug]}.get.ts       # read-only, hanya status=published
│       ├── server/api/{category,tag}/[slug].get.ts      # archive listing
│       └── server/routes/media/[...path].get.ts         # SAME route as admin, same shared disk folder
├── themes/default/              # Nuxt Layer kosong (reference theme, diisi Phase 6)
└── plugins/                     # kosong (Phase 7)
```

`packages/core/src/domain/{taxonomy,media}/` menambahkan `TaxonomyService` dan
`MediaService` + `StorageAdapter`/`LocalDiskStorage`; `packages/core/src/registry/taxonomies.ts`
mendaftarkan taxonomy `category`/`tag`. Schema baru: `packages/core/src/db/schema/{taxonomy,media}.ts`.

**Catatan penyimpangan kecil dari plan awal**: plan menyebut `packages/blocks/src/schema.ts`
sebagai tempat definisi `BlockNode`/`ContentDocument`. Karena `ContentService` di
`packages/core` juga perlu tipe itu untuk mengetik kolom jsonb (`$type<ContentDocument>()`),
dan arah dependency yang sudah ditetapkan plan adalah **blocks → core, bukan sebaliknya**,
tipe kanonik ini sekarang didefinisikan di `packages/core/src/shared/content-doc.ts`
(termasuk `contentDocumentSchema` zod untuk validasi body API). `packages/blocks/src/schema.ts`
tinggal re-export dari `@selftaught/core`. Ini konsisten dengan aturan dependency yang
sudah eksplisit di plan, cuma lokasi file-nya digeser.

## Environment lokal (sudah di-setup, tidak perlu diulang)

- **Node**: diupgrade dari v16.20.2 (default OS) ke **v22.23.2** via NodeSource apt repo
  (`curl -fsSL https://deb.nodesource.com/setup_22.x | bash && apt install nodejs -y`)
- **pnpm**: `12.4.1` via `corepack enable && corepack prepare pnpm@latest --activate`
- **PostgreSQL**: **native apt package (v12)**, BUKAN Docker — Docker tidak tersedia di
  sandbox ini (nested container, tidak ada docker daemon). Cluster `12/main` jalan di
  port 5432, database `selftaught`, user `postgres` / password `postgres`.
  - Kalau restart environment dan Postgres mati: `pg_ctlcluster 12 main start`
  - Cek status: `pg_lsclusters`
  - `docker-compose.yml` tetap ditulis dengan target `postgres:16-alpine` untuk
    **deployment produksi** — jangan bingung, itu bukan untuk dev di sandbox ini.
- **`.env`** sudah ada di root (di-gitignore, **tidak ter-commit**) dengan
  `DATABASE_URL=postgres://postgres:postgres@localhost:5432/selftaught` dan
  `NUXT_SESSION_PASSWORD` random. Kalau file ini hilang, copy ulang dari
  `.env.example` dan generate ulang secret (`openssl rand -hex 24`).

### Kalau mulai dari environment yang benar-benar baru (tanpa histori ini)

```bash
# Node 22 (kalau versi sistem masih lama)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash
apt install nodejs -y
corepack enable && corepack prepare pnpm@latest --activate

# Postgres native (kalau tidak ada Docker)
apt install postgresql postgresql-contrib -y
pg_ctlcluster 12 main start   # sesuaikan versi cluster
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE selftaught;"
sudo -u postgres psql -d selftaught -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"  # WAJIB, lihat Gotcha #2

cp .env.example .env   # lalu isi NUXT_SESSION_PASSWORD dengan random string
pnpm install            # akan minta approve build scripts (argon2/esbuild/unrs-resolver/vue-demi) — jawab true di pnpm-workspace.yaml allowBuilds
pnpm --filter @selftaught/core exec drizzle-kit generate   # kalau ada perubahan schema
pnpm --filter @selftaught/core db:migrate
pnpm --filter @selftaught/core db:seed
```

## Gotcha yang sudah ditemukan (jangan debug ulang)

1. **Import relatif di `packages/core/src/**` TIDAK BOLEH pakai ekstensi `.js`**
   (`from "./foo.js"`). `drizzle-kit generate`/`studio` me-require file secara CJS
   dan gagal cari `foo.js` literal (yang tidak ada, hanya `foo.ts`). Semua import
   relatif di `packages/core` sudah ditulis **tanpa ekstensi** (`from "./foo"`) —
   pertahankan pola ini untuk file baru di `packages/core` dan `packages/blocks`.

2. **Postgres 12 (default apt Ubuntu 20.04) tidak punya `gen_random_uuid()` built-in**
   (baru native sejak Postgres 13). Schema kita pakai `.defaultRandom()` Drizzle yang
   generate `gen_random_uuid()`. Sudah di-fix dengan
   `CREATE EXTENSION IF NOT EXISTS pgcrypto;` di database `selftaught`. Kalau bikin
   database baru di environment ini, extension itu wajib diaktifkan dulu sebelum
   migrate. Di produksi (Postgres 16 via docker-compose) ini tidak masalah.

3. **Module augmentation `nuxt-auth-utils` (`declare module "#auth-utils"`) HARUS
   ditaruh di `apps/<app>/shared/**/*.d.ts`**, bukan di root project
   (`apps/<app>/auth.d.ts`). `tsconfig.server.json` yang di-generate Nuxt hanya
   include `server/**/*` dan `shared/**/*.d.ts` — file `.d.ts` di root app cuma
   ke-pick-up oleh `tsconfig.app.json` (client), sehingga server-side type checking
   (`nuxt typecheck`) tetap error kalau taruh di root. Lihat
   `apps/admin/shared/types/auth.d.ts` sebagai contoh yang benar.

4. **`@nuxt/eslint-config` package tidak punya default export** untuk dipakai
   langsung sebagai root flat config (`import nuxt from "@nuxt/eslint-config/flat"`
   akan syntax error). Solusi yang dipakai: root `eslint.config.mjs` pakai
   `typescript-eslint` polos (untuk `packages/*`, `apps/**` di-ignore), dan setiap
   Nuxt app punya `eslint.config.mjs` sendiri yang re-export
   `./.nuxt/eslint.config.mjs` (hasil generate dari module `@nuxt/eslint` yang
   didaftarkan di `modules: [...]` masing-masing app). Ini pola resmi Nuxt
   (eslint.nuxt.com), bukan workaround custom.

5. **pnpm punya security gate untuk install scripts** (`ERR_PNPM_IGNORED_BUILDS`).
   Native/postinstall packages (`argon2`, `esbuild`, `unrs-resolver`, `vue-demi`)
   butuh approval eksplisit di `pnpm-workspace.yaml` → `allowBuilds: { <pkg>: true }`.
   Sudah di-set semua `true` (semua legit, sudah dicek). Kalau `pnpm install`
   menambah entry baru dengan nilai string instruksi (bukan boolean), berarti ada
   dependency native baru — cek dulu itu package apa sebelum approve.

6. **`@types/node` dan `vue-tsc` harus ada di root `devDependencies`** — tanpa itu,
   `tsc --noEmit` di `packages/core` gagal (`Cannot find name 'process'/'console'`)
   dan `nuxt typecheck` di app manapun gagal (`A type checker is required`).

7. **Cookie session `nuxt-auth-utils` diberi flag `Secure` by default** (benar,
   untuk produksi HTTPS). Testing manual via `curl http://localhost:3000` TIDAK
   akan mengirim cookie itu kembali (curl mematuhi flag Secure ketat di http://).
   Ini **bukan bug** — browser modern (Chrome/Firefox) menganggap `localhost`
   sebagai secure context jadi tetap jalan normal di browser. Untuk test manual via
   curl, ambil cookie value dari header `Set-Cookie` response login lalu kirim
   manual via `-H "Cookie: nuxt-session=..."` (bukan `-b/-c` cookie jar biasa).

8. **`pnpm --filter <app> dev` TIDAK otomatis membaca `.env` di root** — Nuxt/Nitro
   cuma cari `.env` di rootDir app itu sendiri (`apps/admin/.env`), bukan root
   monorepo, dan `pnpm --filter` mengganti cwd ke folder app tersebut. **Sudah
   di-fix**: root scripts (`dev:admin`, `dev:frontend`, `build:*`, `db:migrate`,
   `db:seed`, `db:studio` di `package.json`) sekarang dibungkus
   `dotenv -e .env -- ...` (package `dotenv-cli`). Pakai `pnpm dev:admin` /
   `pnpm db:migrate` dst dari root seperti biasa — jangan panggil
   `pnpm --filter @selftaught/admin dev` langsung kalau butuh `DATABASE_URL`
   (kecuali sudah `source .env` manual dulu di shell, yang tetap valid untuk
   testing cepat/curl karena env terwarisi ke child process apa pun).

9. **`packages/blocks` yang mengekspor komponen `.vue` dari barrel `.ts`
   (`export { default as BlockRenderer } from "./render/BlockRenderer.vue"`)**
   butuh `packages/blocks/src/shims.d.ts` (`declare module "*.vue"`) supaya
   `tsc`/`vue-tsc --noEmit` standalone di package itu tidak error "cannot find
   module". Nuxt app yang mengonsumsinya tidak butuh shim ini (Nuxt sudah
   menyediakan shim `*.vue` sendiri secara global).

10. **Komponen Vue rekursif** (`BlockRenderer.vue` memanggil dirinya sendiri
    untuk children, `MarkWrap.vue` memanggil dirinya sendiri untuk nested
    marks) **jalan tanpa registrasi eksplisit** di Vue 3 `<script setup>` —
    compiler SFC otomatis mendaftarkan komponen di bawah nama filename-nya.
    Tidak perlu `components: { BlockRenderer }` manual.

11. **`MEDIA_LOCAL_PATH=../../data/media`** (bukan `./data/media`) — disengaja.
    Path relatif ke `process.cwd()` masing-masing app, dan `apps/admin` +
    `apps/frontend` sama-sama persis 2 level di bawah root, jadi `../../data/media`
    resolve ke folder yang SAMA di disk untuk keduanya. Ini penting karena admin
    yang upload file, tapi frontend yang harus bisa serve/render file yang sama
    secara publik — kalau pakai `./data/media` tiap app akan punya folder
    terpisah dan gambar yang diupload di admin akan 404 di frontend.

12. **`media.id` (UUID baris DB) BUKAN sama dengan storage key/URL path-nya.**
    `MediaService.upload()` generate `randomUUID()` terpisah sebagai nama file
    fisik (`<random-uuid>.<ext>`), independen dari `media.id`. Jangan pernah
    bikin URL manual seperti `` `/media/${featuredMediaId}` `` — itu akan 404.
    Selalu resolve lewat `mediaService.getByIdWithUrl(id)` (atau field
    `featuredMediaUrl` yang sudah di-resolve oleh endpoint post) untuk dapat URL
    yang benar.

13. **PENTING — Nuxt typed-fetch meledak ("Excessive stack depth comparing
    types") begitu jumlah dynamic-segment API routes cukup banyak** (mulai
    kena di admin sejak ~15 route termasuk yang bersarang seperti
    `posts/[id]/revisions/[revisionId]/restore`). Ini kena di `nuxt typecheck`
    (vue-tsc), bukan runtime. **Sudah di-fix permanen** dengan
    `apps/admin/app/utils/api.ts` yang expose `apiFetch<T>()`/`useApiFetch<T>()`
    — wrapper tipis di atas `$fetch`/`useFetch` yang meng-cast URL ke `any`
    (skip typed-route matching sepenuhnya) dan pakai generic `<T>` eksplisit
    untuk tipe response (lihat interface `PostDetail`, `PostSummary`,
    `MediaItem`, `TermSummary`, `RevisionSummary` di file yang sama). **WAJIB
    pakai `apiFetch`/`useApiFetch` (bukan `$fetch`/`useFetch` langsung) untuk
    SEMUA panggilan API baru di admin** mulai sekarang — termasuk yang
    urlnya masih literal statis, supaya tidak kambuh lagi begitu Phase 5-7
    menambah lebih banyak route. Widening URL ke `string` biasa (percobaan
    pertama, sekarang sudah dibuang) TIDAK cukup — harus `as any` yang benar-benar
    skip type matching-nya.

## Kredensial dev (lokal, dari seed)

- Admin login: **admin@example.com** / **changeme123!**
  (override via env `ADMIN_EMAIL` / `ADMIN_PASSWORD` sebelum `pnpm db:seed` kalau mau beda)
- 4 role sistem: `admin` (semua 10 capability), `editor`, `author`, `contributor`
- Ganti password admin setelah login pertama di lingkungan non-dev.

## Perintah penting

```bash
# Dev servers
pnpm dev:admin       # http://localhost:3000
pnpm dev:frontend    # http://localhost:3001

# Database (dijalankan dari root, target packages/core)
pnpm db:generate     # drizzle-kit generate — bikin migration baru dari perubahan schema
pnpm db:migrate      # apply migration
pnpm db:seed         # seed capabilities/roles/admin user
pnpm db:studio       # drizzle-kit studio (GUI browser DB)

# Quality gates (jalankan sebelum commit)
pnpm typecheck       # -r --parallel typecheck di semua package (core: tsc, admin/frontend: nuxt typecheck)
pnpm lint            # eslint . (root config untuk packages/*, tiap app pakai config sendiri — lihat Gotcha #4)
```

## Ringkasan Phase 2 (selesai)

`content`/`content_meta` table (migration `0001_bouncy_winter_soldier.sql`),
`ContentTypeRegistry` (post + page terdaftar, tapi UI/API CRUD baru dibangun
untuk **post** — "page" baru terdaftar di registry, belum ada halaman admin/API
sendiri, jadi itu bagian yang masih tersisa dan gampang ditambah dengan pola
yang sama persis seperti posts), `ContentService` (create/update/publish/
unpublish/delete/getById/getBySlug/list — state machine penuh draft→pending→
scheduled masih Phase 4), `@selftaught/blocks` (BlockRegistry + 10 default
render component + BlockRenderer rekursif), `BlockEditor.vue` di admin (Tiptap
StarterKit + Image), full CRUD posts di admin (`/posts`, `/posts/new`,
`/posts/[id]`), dan halaman publik `/blog`, `/blog/[slug]` di frontend yang
hanya menampilkan post `status=published`.

**Terverifikasi end-to-end via curl**: login → create draft (belum tampil di
frontend, 404) → publish (langsung tampil, block content ter-render benar:
paragraph, heading h2) → unpublish → update title → delete. Semua lint+typecheck
bersih di `core`/`blocks`/`admin`/`frontend`.

## Ringkasan Phase 3 (selesai)

`terms`/`content_terms` + `media` tables (migration `0002_grey_weapon_omega.sql`),
`TaxonomyRegistry` (category/tag terdaftar), `TaxonomyService`, `MediaService`
+ `LocalDiskStorage` (`StorageAdapter` interface, siap diganti S3 nanti tanpa
ubah service), `sharp` untuk ekstrak width/height gambar. Admin: media library
(`/media`, upload+delete), categories/tags CRUD (`/categories`, `/tags`, pakai
komponen bersama `TaxonomyManager.vue`), featured-image picker + category/tag
toggle di editor post (`posts/[id].vue`). Frontend: `/category/[slug]`,
`/tag/[slug]` archive pages, featured image + term links tampil di
`/blog/[slug]`. `content.featuredMediaId` dan `users.avatarMediaId` **tetap
tanpa FK constraint eksplisit** (dibiarkan plain `uuid` kolom, referensi
"lunak" ke `media.id`) supaya `schema/content.ts`/`users.ts` tidak perlu
circular-import ke `schema/media.ts` — `avatarMediaId` sendiri belum
ditambahkan sama sekali (di luar scope Phase 3, tidak ada fitur yang butuh).

**Terverifikasi end-to-end via curl**: upload gambar (sharp baca dimensi
benar) → file bisa di-serve dari KEDUA app (disk sharing lewat
`MEDIA_LOCAL_PATH`) → buat category+tag → buat post → assign featured
image+terms → publish → `/blog/[slug]` tampilkan gambar unggulan + link
kategori/tag yang benar → `/category/[slug]` dan `/tag/[slug]` menampilkan
post yang sesuai. Lint+typecheck bersih di semua package/app.

## Ringkasan Phase 4 (selesai)

`revisions` table (migration `0003_rare_leper_queen.sql`, full snapshot bukan
diff), `RevisionService` (snapshot/listForContent/getById). `ContentService`
dirombak total: `transitionStatus(actor, id, next, opts?)` generik dengan
`ALLOWED_TRANSITIONS` map yang menegakkan state machine penuh (draft↔pending↔
scheduled→published, apa saja→trashed→draft), method turunan tipis
(`publish`/`unpublish`/`submitForReview`/`schedule`/`trash`/`restoreFromTrash`),
`restoreRevision` (snapshot state SEKARANG dulu sebelum overwrite, jadi restore
sendiri bisa di-undo), dan `publishDueScheduled()` untuk dipanggil dari Nitro
task (system-level action, tidak butuh `actor`/capability check — cron bukan
user). `ContentService` sekarang butuh `RevisionService` di constructor
(lihat `packages/core/src/server.ts`). Nitro scheduled task
`apps/admin/server/tasks/content/publish-scheduled.ts` (nama task
`content:publish-scheduled`, dari path `server/tasks/content/publish-scheduled.ts`)
jalan tiap menit via `nitro.scheduledTasks: { "* * * * *": [...] }` +
`nitro.experimental.tasks: true` di `apps/admin/nuxt.config.ts`. Admin UI:
action bar `posts/[id].vue` sekarang punya tombol kondisional sesuai status
(Ajukan Review/Jadwalkan/Publish/Batalkan/Pindah ke Trash/Pulihkan/Hapus
Permanen) + panel Revisions dengan tombol "Pulihkan versi ini"; halaman baru
`/trash`.

**Terverifikasi end-to-end via curl**, termasuk menunggu cron beneran jalan
(bukan simulasi): create → update (snapshot revisi v1 sebelum jadi v2,
terverifikasi isi revisinya benar) → submit review (draft→pending) → schedule
dengan `scheduledAt` di masa lalu → **tunggu ~45 detik, Nitro cron beneran
auto-publish-kan** → restore revisi (snapshot v2 dulu, balik ke v1, isi
konten terverifikasi benar berubah) → trash → untrash → **transisi ilegal
(trashed→published) ditolak** oleh state machine. Lint+typecheck bersih di
semua package/app.

**Keterbatasan kecil yang diketahui (belum di-fix, tidak blocking)**: error
domain (`assertCan`/`transitionStatus` throw `Error` biasa) saat ini muncul
ke client sebagai HTTP 500 (bukan 400/403) karena h3's `defineEventHandler`
membungkus thrown `Error` generik jadi 500 — pesannya tetap benar dan tampil
ke user (`statusMessage`), cuma status code-nya kurang presisi secara REST.
Perbaikan idealnya: custom error classes (`CapabilityError`, `TransitionError`)
+ mapping ke `createError({statusCode, ...})` di boundary API. Belum krusial
karena `requireCapability` di API layer sudah menangkap kasus paling umum
(401/403 yang benar); ini cuma soal defense-in-depth di service layer.

## Cara lanjut ke Phase 5 (SEO subsystem)

Baca bagian "Phase 5" di plan file
(`/root/.claude/plans/saya-ingin-membangun-sebuah-tingly-spring.md`). Ringkas:

1. `packages/core/src/db/schema/seo.ts` — tabel `content_seo` (contentId 1:1 PK/FK
   ke `content.id`, title, description, ogImageMediaId, canonicalUrl, noindex,
   structuredDataOverride jsonb) + tabel `settings` (key pk, value jsonb) untuk
   default SEO site-wide (site title, default OG image, dll)
2. `SeoService` — `resolve(content)` (fallback ke title/excerpt content lalu ke
   `settings` kalau field SEO kosong), `generateJsonLd(content)` (Article/
   BlogPosting untuk post, WebPage untuk page, merge dengan
   `structuredDataOverride` kalau admin isi manual)
3. Admin: panel SEO di sidebar editor post (title/description/OG
   image-picker pakai pola yang sama seperti featured-image picker/canonical/
   noindex toggle), halaman Settings (General + SEO defaults)
4. Frontend: `useSeoMeta()`/`useHead()` di `blog/[slug].vue` (dan halaman
   lain) pakai hasil `SeoService.resolve()`, `server/routes/sitemap.xml.ts`
   (query semua published content + taxonomy archive, hormati `noindex`),
   `server/routes/robots.txt.ts` (toggle via `settings`)

Ikuti pola yang SUDAH ada: service menerima `Database` di constructor, singleton
di `packages/core/src/server.ts`, zod schema di `packages/core/src/shared/`.
**WAJIB** pakai `apiFetch`/`useApiFetch` dari `apps/admin/app/utils/api.ts`
untuk endpoint baru (lihat Gotcha #13) — jangan `$fetch`/`useFetch` langsung.

## Git

Repo sudah `git init` (local repo, belum ada remote). Identitas git di-set lokal
(bukan `--global`): `user.email=sisalamdev@gmail.com`. Satu commit per fase —
jalankan `git log --oneline` untuk daftar terkini (jangan andalkan daftar hash
statis di dokumen ini, gampang basi).
