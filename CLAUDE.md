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

**STATUS: semua 8 fase (Phase 0-7) dari roadmap awal sudah selesai dan
ter-commit.** CMS ini punya: auth+RBAC, content CRUD lengkap dengan block
editor, taxonomies, media library, revisions, publishing workflow penuh
(draft/pending/scheduled/published/trashed + cron auto-publish), SEO
subsystem, theme layer yang swappable, dan hook/plugin system dengan contoh
plugin yang benar-benar jalan. Lihat bagian "Item yang sengaja ditunda" di
paling bawah dokumen ini untuk daftar hal yang BUKAN bug/lupa, melainkan
keputusan scope sadar sepanjang pengerjaan (page CRUD, Roles admin UI, dll).

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
- ✅ **Phase 4 — Revisions + full publishing workflow**
- ✅ **Phase 5 — SEO subsystem**
- ✅ **Phase 6 — Frontend polish + theme layer**
- ✅ **Phase 7 — Hook/plugin system + example plugin** (lihat bagian di bawah — **SEMUA 8 FASE SELESAI**)

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
│   │   ├── src/registry/capabilities.ts # CAPABILITIES const (literal union, type-safe) + capabilityRegistry class (.register() untuk plugin) + SYSTEM_ROLES
│   │   ├── src/hooks/hook-bus.ts        # HookBus: onAction/emitAction/onFilter/applyFilter, ActionMap augmentable
│   │   ├── src/plugins/define-plugin.ts # definePlugin()/createPluginContext() — {hooks,contentTypes,taxonomies,capabilities}
│   │   ├── src/auth/password.ts         # argon2 hash/verify
│   │   ├── src/shared/                  # types.ts (AuthUser/Actor), auth-schemas.ts (zod loginSchema)
│   │   ├── src/server.ts                # server-only barrel + singleton services (userService, roleService, permissionService, dst)
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
│   │   ├── server/api/posts/[id]/seo.{get,put}.ts, server/api/settings/index.{get,patch}.ts
│   │   ├── app/pages/settings.vue
│   │   ├── server/routes/media/[...path].get.ts   # serves uploaded files from MEDIA_LOCAL_PATH
│   │   ├── plugins.config.ts              # daftar plugin server-side aktif (di root app, bukan app/)
│   │   ├── server/plugins/00.load-plugins.ts  # Nitro plugin: jalankan setup() tiap plugin + sync capability ke DB
│   │   ├── app/plugins/load-plugins.ts    # Nuxt app plugin: daftarkan editor panel plugin ke adminUIRegistry
│   │   ├── app/utils/admin-ui-registry.ts # AdminUIRegistry (UI-only, TIDAK di core) — registerMenuItem/registerEditorPanel
│   │   └── server/api/posts/[id]/meta.{get,put}.ts  # baca/tulis content_meta (dipakai plugin panel)
│   └── frontend/                # Nuxt 4, port 3001 — TIPIS: cuma server/ + config, extends themes/default
│       ├── nuxt.config.ts       # extends + routeRules (SWR 60s di /blog,/category,/tag) + runtimeConfig
│       ├── server/api/posts/{index,[slug]}.get.ts       # index.get.ts: paginated {posts,page,totalPages}; [slug] includes resolved `seo`+`jsonLd`
│       ├── server/api/{category,tag}/[slug].get.ts      # archive listing
│       ├── server/routes/sitemap.xml.ts, robots.txt.ts  # (public/robots.txt statis SUDAH DIHAPUS, lihat Gotcha soal ini)
│       └── server/routes/media/[...path].get.ts         # SAME route as admin, same shared disk folder
├── themes/default/              # @selftaught/theme-default — pnpm workspace package SUNGGUHAN (lihat Gotcha #15)
│   ├── package.json             # declare @selftaught/core+blocks (deps) & @nuxt/kit+tailwindcss/vite+nuxt+vue (devDeps)
│   ├── nuxt.config.ts           # css + tailwindcss vite plugin, pakai createResolver() bukan `~/...` (Gotcha #14)
│   └── app/{app.vue,error.vue,pages/{index,blog/{index,[slug]},category/[slug],tag/[slug]}.vue,assets/css/main.css}
└── plugins/example-plugin/      # @selftaught/example-plugin — bukti hook/registry/AdminUI extension points jalan
    ├── package.json             # exports: "./server" (definePlugin), "./editor-panel" (Vue component wrapper)
    ├── src/server.ts            # definePlugin({ id, setup(ctx) {...} }) — register capability + hook content:published
    ├── src/EditorPanel.vue      # panel sidebar post editor, baca/tulis content_meta lewat $fetch polos
    └── src/editor-panel.ts      # re-export .ts tipis dari .vue (lihat catatan "*.vue subpath export" di bawah)
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

14. **Nuxt Layers: string relatif `~/...` di dalam `css: [...]` sebuah layer
    resolve ke srcDir APP YANG MENG-EXTEND, bukan ke layer itu sendiri** —
    counter-intuitive. Kalau layer (`themes/default/nuxt.config.ts`) mau
    reference file miliknya sendiri (CSS, dll), WAJIB pakai
    `createResolver(import.meta.url).resolve("./app/...")` dari `@nuxt/kit`,
    bukan string `~/...` biasa. Lihat `themes/default/nuxt.config.ts`.

15. **Nuxt Layer yang isinya import package workspace (`@selftaught/core`,
    dll) HARUS jadi pnpm workspace package sungguhan** (punya `package.json`
    sendiri yang declare dependency-nya), meskipun secara runtime
    Vite/Nitro bisa resolve tanpa itu (karena bundler resolve relatif ke
    rootDir app yang meng-extend). `vue-tsc`/`nuxt typecheck` resolve modul
    dari LOKASI FISIK FILE di disk, jadi kalau `themes/default/app/pages/*.vue`
    import `@selftaught/core` tapi `themes/default` tidak punya
    `node_modules` sendiri (bukan workspace member), typecheck gagal
    "Cannot find module" walau `nuxt dev` jalan normal. Sudah di-fix:
    `themes/default/package.json` (nama `@selftaught/theme-default`) declare
    `@selftaught/core`/`@selftaught/blocks` sebagai dependency dan
    `@nuxt/kit`/`@tailwindcss/vite`/`nuxt`/`vue` sebagai devDependency. Kalau
    bikin theme baru yang import package workspace, ulangi pola ini.

16. **`throw createError({statusCode:404,...})` di dalam halaman Nuxt SSR
    kadang balas JSON mentah alih-alih halaman `error.vue` kalau di-test
    pakai `curl` polos** (curl default `Accept: */*` tidak dianggap
    "browser request" oleh Nitro). **Bukan bug** — browser sungguhan selalu
    kirim `Accept: text/html,...` dan akan dapat halaman error.vue yang
    benar. Untuk test manual via curl, tambahkan `-H "Accept: text/html"`.

17. **PALING KRITIS — jangan sentuh `apps/admin/app/utils/api.ts` tanpa baca
    ini dulu.** Riwayat 3 percobaan untuk fix Gotcha #13 (stack-depth) yang
    masing-masing terlihat benar tapi TERNYATA rusak dengan cara berbeda:
    - **Percobaan 1**: widen URL ke `string` biasa (`apiUrl()` helper) —
      TIDAK memperbaiki stack-depth sama sekali, cuma memindahkan error.
    - **Percobaan 2**: `$fetch(url as any, ...)` — memperbaiki stack-depth
      untuk apiFetch, TAPI begitu jumlah route bertambah lagi (nambah
      `posts/[id]/meta`), stack-depth kambuh LAGI di call site yang sama,
      karena **cast `any` pada ARGUMEN tidak mencegah TS meng-resolve
      overload `$fetch` itu sendiri** — resolusi overload itulah yang mahal,
      bukan pencocokan argumennya.
    - **Percobaan 3**: ambil `$fetch` dari `globalThis` sekali di module-scope
      (`const rawFetch = (globalThis as any).$fetch`) — INI MEMPERBAIKI
      stack-depth (typecheck lolos!) TAPI **diam-diam merusak SSR**: referensi
      itu bukan instance `$fetch` yang request-scoped, jadi kehilangan
      forwarding cookie/context. Akibatnya semua halaman admin yang fetch
      data server-side (post editor, dll) mengembalikan 404 palsu meskipun
      API endpoint-nya sendiri benar (dibuktikan dengan curl langsung ke
      endpoint API — selalu 200). **Baru ketahuan setelah test manual buka
      halaman editor via curl dengan cookie, BUKAN dari typecheck/lint yang
      semuanya hijau.** Pelajaran: perbaikan yang bikin `nuxt typecheck`
      lolos TIDAK otomatis berarti runtime-nya benar — selalu uji SSR
      sungguhan (curl halaman HTML, bukan cuma endpoint JSON) setiap kali
      mengubah cara fetch data.
    - **Fix final (yang sekarang dipakai)**: `apiFetch` pakai
      `useRequestFetch()` (fetch yang genuinely request-scoped — dokumentasi
      resmi Nuxt untuk internal API call dari kode SSR, no-op alias ke
      `$fetch` biasa di client) di-cast ke tipe fungsi polos LEWAT `unknown`
      SETELAH dipanggil `useRequestFetch()` (bukan argumennya yang di-cast),
      dipanggil FRESH di dalam function body (bukan di module scope, karena
      butuh context request Nuxt yang cuma ada per-panggilan). **DAN**
      `useApiFetch` WAJIB tetap `async function` yang benar-benar
      `await useAsyncData(...)` di dalam tubuhnya (bukan cuma
      `return useAsyncData(...)` lalu caller yang `await` hasil WRAPPER kita) —
      soalnya nilai balik `useAsyncData` itu "awaitable" secara khusus (bikin
      SSR benar-benar menunggu fetch selesai sebelum render), dan begitu kita
      bungkus ulang jadi object polos `{data, pending, ...}`, sifat
      awaitable itu HILANG — `await useApiFetch(...)` bakal langsung resolve
      di microtask berikutnya dengan `data` masih `null`/default, padahal
      fetch aslinya baru selesai belakangan (persis bug yang bikin halaman
      editor 404 palsu di atas). Lihat komentar panjang di
      `apps/admin/app/utils/api.ts` untuk detail lengkap — **JANGAN diubah
      tanpa re-test SSR end-to-end (buka halaman `/posts/[id]` via curl
      dengan cookie session, bukan cuma jalankan typecheck).**

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

## Ringkasan Phase 5 (selesai)

`content_seo` (1:1 ke `content`) + `settings` (key/value jsonb) tables
(migration `0004_productive_the_order.sql`). `SettingsService` (get/set/getAll,
generic key-value, dipakai untuk `siteName`/`siteDescription`/
`defaultOgImageMediaId`/`discourageSearchEngines`). `SeoService.resolve(content)`
— title/description fallback content→settings, OG image fallback SEO row→
site default (featuredMediaUrl di-fallback lagi di level API route kalau
`ogImageUrl` masih kosong); `generateJsonLd()` (BlogPosting/WebPage + merge
`structuredDataOverride`); `sitemapEntries()` (skip yang `noindex`). Admin:
panel SEO di `posts/[id].vue` (title/description/canonical/OG-image-picker/
noindex, tersimpan bareng tombol Simpan utama lewat `Promise.all`), halaman
baru `/settings` (General + default OG image + toggle "cegah indexing").
Frontend: `useSeoMeta`+`useHead` (title/description/OG/canonical/JSON-LD
`<script>`) di `blog/[slug].vue` pakai field `seo`/`jsonLd` yang sudah
di-resolve oleh `server/api/posts/[slug].get.ts`; `server/routes/sitemap.xml.ts`
dan `robots.txt.ts` (hapus dulu `public/robots.txt` statis bawaan `nuxi init`
yang bentrok path-nya dengan server route dinamis).

**Terverifikasi end-to-end via curl**: custom SEO override tampil benar di
`<title>`/meta description/canonical/JSON-LD halaman publik; post TANPA SEO
custom fallback ke title/excerpt dengan benar; `noindex=true` membuat post
hilang dari `/sitemap.xml`; toggle `discourageSearchEngines` mengubah
`/robots.txt` jadi `Disallow: /`. Lint+typecheck bersih di semua package/app
(frontend belum butuh fix `apiFetch`/Gotcha #13 — jumlah route-nya masih
sedikit, tapi tetap waspada kalau Phase 6/7 menambah banyak route dinamis
di frontend juga).

## Ringkasan Phase 6 (selesai)

`apps/frontend/app/` (pages/app.vue/assets) dipindah SELURUHNYA ke
`themes/default/app/` — `apps/frontend` sekarang cuma berisi `nuxt.config.ts`
(extends + routeRules + runtimeConfig) dan `server/` (API routes + media
serving), tidak ada `app/` lokal sama sekali; semua tampilan diwarisi dari
layer. `themes/default` jadi pnpm workspace package sungguhan (lihat Gotcha
#15) supaya `nuxt typecheck` bisa resolve `@selftaught/core`/`@selftaught/blocks`
dari lokasi fisik file di dalam theme. CSS+Tailwind Vite plugin dipindah ke
`themes/default/nuxt.config.ts` sendiri pakai `createResolver()` (Gotcha #14),
supaya theme benar-benar self-contained (ganti path `extends` di
`apps/frontend/nuxt.config.ts` = ganti seluruh tampilan tanpa sentuh apps/frontend
sama sekali). Tambahan: `ContentService.list()`/`count()` sekarang dukung
`limit`/`offset` untuk pagination; `/blog` dan homepage (`/`) pakai itu lewat
`GET /api/posts?page=N&limit=M` (response `{posts,page,totalPages}` —
**BREAKING CHANGE** dari Phase 2-5 yang responnya array polos, tapi cuma
dikonsumsi `blog/index.vue`+homepage, sudah diupdate bareng); `themes/default/app/error.vue`
custom error page; `routeRules` SWR 60s di `/blog/**`,`/category/**`,`/tag/**`.

**Terverifikasi**: `nuxt dev` frontend boot normal dari layer (bukan lagi dari
`apps/frontend/app/` yang sudah tidak ada), homepage tampilkan 5 post terbaru,
pagination `?page=1&2` mengembalikan halaman berbeda dengan benar, halaman
404 custom render dengan benar (browser asli — lihat Gotcha #16 soal test
`curl`). Lint+typecheck bersih di semua package/app.

**Sengaja DITUNDA (bukan lupa)**: CRUD content type "page" (list/create/edit
admin + API) — masih cuma terdaftar di `ContentTypeRegistry` sejak Phase 2,
belum ada UI/API-nya sama sekali. Konsekuensinya: `settings.homepageContentId`
(static front page ala WordPress) TIDAK diimplementasikan — homepage cuma
mode "latest posts". Alasan skip: Phase 7 (hook/plugin system) adalah fase
TERAKHIR di roadmap dan lebih penting untuk membuktikan tujuan inti CMS ini
("dirancang mendukung theme dan plugin"); membangun Page CRUD penuh (≈15 file
API+UI meniru persis pola posts) akan menghabiskan budget yang mestinya untuk
fase terakhir. Page CRUD gampang ditambah kapan saja nanti — ikuti pola
`apps/admin/server/api/posts/*` dan `apps/admin/app/pages/posts/*` persis,
tanpa bagian categories/tags (tipe "page" tidak punya taxonomy), tambah
picker `parentId` (dropdown page lain) dan input `menuOrder` untuk hierarki.

## Ringkasan Phase 7 (selesai — FASE TERAKHIR DARI ROADMAP)

`HookBus` (`packages/core/src/hooks/hook-bus.ts`) — `onAction`/`emitAction`/
`onFilter`/`applyFilter`, `ActionMap` interface berisi 4 hook bawaan
(`content:beforeSave`, `content:statusChanged`, `content:published`,
`user:registered`) yang augmentable via `declare module "@selftaught/core/server"`.
Hook nyata di-emit dari `ContentService.update()`/`transitionStatus()`/
`publishDueScheduled()` dan `UserService.create()`. `CapabilityRegistry`
(`packages/core/src/registry/capabilities.ts`) direfactor jadi class dengan
`.register()`/`.list()` — `CAPABILITIES`/`CapabilityKey` (literal union,
type-safe) TETAP ADA untuk built-in capabilities, registry cuma nambah jalur
untuk capability BARU dari plugin (sebagai plain string, tanpa autocomplete —
tradeoff yang disengaja). `RoleService` dapat 2 method baru:
`syncCapabilities()` (upsert capability baru ke tabel `capabilities`) dan
`grantCapabilityToRole()` (dipakai supaya role `admin` selalu lengkap
walau ada capability baru dari plugin). `definePlugin()`/`createPluginContext()`
(`packages/core/src/plugins/define-plugin.ts`) — `PluginContext` cuma berisi
`{hooks, contentTypes, taxonomies, capabilities}`; `blocks` SENGAJA tidak
dimasukkan (core tidak boleh depend ke `@selftaught/blocks` — plugin yang mau
register block baru tinggal `import { blockRegistry } from "@selftaught/blocks"`
langsung di `setup()`-nya, tidak perlu lewat ctx).

`ContentMetaService` baru (`packages/core/src/domain/content/content-meta-service.ts`)
mengaktifkan tabel `content_meta` yang sudah ada sejak Phase 2 tapi belum
pernah dipakai. `AdminUIRegistry` (`apps/admin/app/utils/admin-ui-registry.ts`,
BUKAN di core — murni UI) untuk `registerMenuItem`/`registerEditorPanel`.
Loading plugin dipecah 2 jalur yang disengaja terpisah: `apps/admin/plugins.config.ts`
+ `server/plugins/00.load-plugins.ts` (Nitro, server-side: jalankan `setup()`
tiap plugin + sync capability ke DB) vs `apps/admin/app/plugins/load-plugins.ts`
(Nuxt app plugin, Vue-side: daftarkan komponen editor panel plugin ke
`adminUIRegistry` — dipisah karena komponen Vue cuma masuk akal di context
Vue app, bukan Nitro server context).

`plugins/example-plugin/` — plugin nyata yang jalan penuh: register capability
`example_plugin_capability`, hook `content:published` (console.log), panel
sidebar `EditorPanel.vue` di post editor yang baca/tulis `content_meta` lewat
`$fetch` polos (BUKAN Nuxt UI components atau `apiFetch`/`useApiFetch` admin —
plugin pihak ketiga tidak boleh asumsi itu semua tersedia). Subpath export
`"./editor-panel"` di `package.json` plugin menunjuk ke wrapper `.ts` tipis
yang re-export `.vue`-nya (BUKAN langsung ke file `.vue`) — lihat komentar di
`plugins/example-plugin/src/editor-panel.ts` soal kenapa (shim `"*.vue"` cuma
cocok untuk specifier yang literal berakhir `.vue`, bukan lewat package
subpath export).

**Bug serius yang ditemukan & diperbaiki di fase ini** (bukan soal plugin,
tapi soal infrastruktur `apiFetch`/`useApiFetch` dari Phase 4): lihat
**Gotcha #17** — 3 percobaan berturut-turut untuk fix stack-depth issue
(Gotcha #13) yang masing-masing lolos typecheck tapi salah satu di antaranya
diam-diam merusak SSR (halaman editor post 404 palsu walau API-nya benar).
Baru ketahuan lewat test SSR manual (curl halaman HTML dengan cookie), bukan
dari typecheck/lint yang semuanya hijau. **Pelajaran penting untuk kerja
lanjutan**: `nuxt typecheck` lolos ≠ runtime benar untuk kode yang menyentuh
fetch/data-loading — selalu verifikasi SSR sungguhan.

**Terverifikasi end-to-end via curl, termasuk regresi penuh lintas semua
fase** (Phase 2-7 sekaligus dalam satu skenario): plugin loader jalan saat
boot → capability plugin ter-sync ke DB dan otomatis ter-grant ke role admin
→ login → buat post → assign kategori+tag+media (Phase 3) → submit review →
update (revisi tersimpan, Phase 4) → publish → SEO custom title ter-resolve
(Phase 5) → panel plugin ter-render di SSR halaman editor (Phase 7) dan
content_meta tersimpan/terbaca lewat panel → halaman publik post/category/tag/
sitemap semua benar (Phase 2/3/5/6) → hook `content:published` ter-log di
server console. Lint+typecheck bersih di SEMUA package (`core`, `blocks`,
`example-plugin`, `admin`, `frontend`, `theme-default`).

## Item yang sengaja ditunda (bukan bug/lupa — keputusan scope sepanjang pengerjaan)

Semua 8 fase roadmap SELESAI, tapi beberapa hal secara sadar di-skip demi
menjaga fase-fase tetap proporsional dalam satu sesi kerja panjang tanpa
checkpoint approval. Ini bukan "belum sempat" — masing-masing sudah
dipertimbangkan dan didokumentasikan di titik ia di-skip:

1. **Content type "page" — CRUD admin/API belum ada** (Phase 2 & 6). Cuma
   terdaftar di `ContentTypeRegistry`. Implementasi: copy persis pola
   `apps/admin/server/api/posts/*` + `apps/admin/app/pages/posts/*` untuk
   `/api/pages` + `/pages`, tanpa bagian categories/tags (tipe "page" tidak
   punya taxonomy di `ContentTypeDefinition`), tambah picker `parentId` +
   input `menuOrder` untuk hierarki halaman ala WordPress.
2. **`settings.homepageContentId` (static front page)** — bergantung pada #1,
   jadi ikut tertunda. Homepage sekarang cuma mode "latest posts".
3. ~~**Roles & Capabilities admin UI**~~ — **SELESAI** (lihat "Ringkasan:
   Users & Roles admin UI" di bawah). Sisa yang masih belum ada: bikin role
   CUSTOM lewat UI (di luar 4 `SYSTEM_ROLES` bawaan) — lihat #6.
4. **Custom error classes untuk HTTP status code presisi** (dicatat di Phase
   4) — service layer (`assertCan`, `transitionStatus`, dst.) throw `Error`
   polos yang jadi HTTP 500 generik lewat h3, bukan 400/403 yang lebih tepat.
   Fungsional benar (pesan error tetap sampai ke user), cuma kurang REST-precise.
5. **`delete_pages`/`publish_pages` capability terpisah** — tipe "page" saat
   ini berbagi satu capability `edit_pages` untuk edit/publish/delete
   sekaligus (lihat `ContentTypeRegistry` di Phase 2), beda dari "post" yang
   granular. Cukup untuk sekarang karena UI/API "page" sendiri belum ada (#1).
6. **Role CUSTOM lewat UI** — `RoleService`/`/roles` sekarang cuma VIEW
   read-only untuk 4 `SYSTEM_ROLES` bawaan (+ capability tambahan dari
   plugin). Assign multi-role ke user SUDAH bisa lewat `/users/[id]`
   (checkbox, `RoleService.setRolesForUser`), tapi bikin role BARU (nama,
   pilih capability sendiri) di luar 4 bawaan belum ada UI/API-nya.
7. **`packages/ui`** — package kosong sejak Phase 0, tidak pernah terpakai.
   Aman dihapus atau diisi kalau nanti ada komponen Vue yang genuinely
   dipakai bersama admin+frontend+theme.

Tidak ada satu pun dari ini yang blocking — semuanya extension yang lurus ke
depan mengikuti pola yang sudah established di codebase.

## Pekerjaan pasca-roadmap #1: Users & Roles admin UI (selesai)

`RoleService` dapat 4 method baru: `removeRole`, `setRolesForUser` (diff
add/remove terhadap role saat ini — dipakai UI untuk "replace" full role set
user via checkbox), `listCapabilities`, `capabilitiesForRole`. `UserService`
dapat `setStatus`/`updateProfile`. Endpoint baru di admin:
`GET/POST /api/users`, `GET/PATCH /api/users/[id]` (capability
`manage_users`), `GET /api/roles` (read-only, capability `manage_users`
juga — belum ada capability `manage_roles` terpisah, dianggap cukup satu
capability untuk keduanya di v1 ini). Halaman: `/users` (list + badge
status/role), `/users/new` (create + assign role via toggle button),
`/users/[id]` (edit displayName/status/roles), `/roles` (viewer read-only
capability per role — BUKAN pembuat role custom, lihat item #6 di atas).

**Terverifikasi via curl**: list roles (termasuk capability plugin dari
Phase 7 ikut ter-hitung di role `admin`) → buat user baru dengan role
`author` → login sebagai user itu → capability yang di-resolve PAS sama
seperti `SYSTEM_ROLES.author` → user itu ditolak (403) akses endpoint
`manage_users` → admin suspend + lepas semua role user itu → user yang
di-suspend tidak bisa login lagi (401). Lint+typecheck bersih.

## Git

Repo sudah `git init` (local repo, belum ada remote). Identitas git di-set lokal
(bukan `--global`): `user.email=sisalamdev@gmail.com`. Satu commit per fase —
jalankan `git log --oneline` untuk daftar terkini (jangan andalkan daftar hash
statis di dokumen ini, gampang basi).
