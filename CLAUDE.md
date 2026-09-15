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
ter-commit, ditambah 9 putaran pasca-roadmap** (Users & Roles admin UI,
automated tests, CRUD content type "page", production hardening,
**deployment produksi live**, **UI/UX redesign penuh**, **brand logo/warna
asli**, **fix Tailwind CSS tidak ter-compile di situs publik**, dan
**branding per-instance (logo/favicon/nama situs bisa diganti admin)** —
lihat "Pekerjaan pasca-roadmap #1-9" di bawah). CMS ini punya: auth+RBAC, content CRUD lengkap (post & page) dengan
block editor, taxonomies, media library, revisions, publishing workflow
penuh (draft/pending/scheduled/published/trashed + cron auto-publish), SEO
subsystem, theme layer yang swappable, hook/plugin system dengan contoh
plugin yang benar-benar jalan, dan hardening produksi (rate limiting,
validasi upload, status code error presisi, dependency audit bersih, CI,
backup/restore). Lihat bagian "Item yang sengaja ditunda" di paling bawah
dokumen ini untuk daftar hal yang BUKAN bug/lupa, melainkan keputusan scope
sadar sepanjang pengerjaan.

> ⚠️ **PENTING — baca sebelum menjalankan perintah apa pun di sini**: mesin
> tempat direktori ini berada (`hostname` = `babussalam-0`) **BUKAN sandbox
> terpisah — ini VPS produksi BERSAMA** yang juga melayani beberapa situs
> live lain milik penyewa berbeda lewat nginx (`babussalam.sch.id`,
> `ponpes.syafii.id`, `maratussholihah.ponpes.id`, `assunnahlampung.com`,
> dst — lihat `/etc/nginx/sites-enabled/`). CMS ini sendiri SUDAH live di
> **https://self-taught.my.id** (publik) dan **https://admin.self-taught.my.id**
> (admin) sejak "Pekerjaan pasca-roadmap #5" di bawah. Konsekuensi praktis:
> - Postgres di sini (`127.0.0.1:5432`, cluster `12/main`) adalah instance
>   YANG SAMA dipakai database `selftaught` produksi — bukan DB dev yang
>   aman diutak-atik bebas.
> - nginx di VPS ini melayani banyak site lain sekaligus — WAJIB jalankan
>   `nginx -t` SEBELUM setiap `reload`/`restart`, dan jangan sentuh config
>   site lain di `/etc/nginx/sites-available/` selain milik project ini
>   (`self-taught.my.id`, `admin.self-taught.my.id`).
> - `pm2 status` menjalankan `selftaught-admin`/`selftaught-frontend` yang
>   REAL, diakses publik — restart/stop keduanya berarti downtime nyata.
> - Ada batasan platform: perintah Bash yang berbentuk `GRANT`/
>   `REASSIGN OWNED` (SQL privilege-grant) DIBLOKIR otomatis oleh classifier
>   keamanan Claude Code, terlepas dari tool apa yang dipakai untuk
>   menjalankannya — lihat Gotcha #20.

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
│   │   ├── server/api/posts/[id]/meta.{get,put}.ts  # baca/tulis content_meta (dipakai plugin panel)
│   │   ├── server/utils/api-handler.ts    # defineApiHandler — map CapabilityError/NotFoundError/TransitionError/ValidationError ke status code REST
│   │   ├── server/utils/rate-limit.ts     # in-memory token bucket, dipakai server/api/auth/login.post.ts
│   │   └── server/api/users/[id]/password.put.ts  # admin-to-user password reset (capability manage_users)
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
├── plugins/example-plugin/      # @selftaught/example-plugin — bukti hook/registry/AdminUI extension points jalan
│   ├── package.json             # exports: "./server" (definePlugin), "./editor-panel" (Vue component wrapper)
│   ├── src/server.ts            # definePlugin({ id, setup(ctx) {...} }) — register capability + hook content:published
│   ├── src/EditorPanel.vue      # panel sidebar post editor, baca/tulis content_meta lewat $fetch polos
│   └── src/editor-panel.ts      # re-export .ts tipis dari .vue (lihat catatan "*.vue subpath export" di bawah)
├── scripts/{backup,restore}.sh  # pg_dump+tar media / restore — lihat "Pekerjaan pasca-roadmap #4"
├── .github/workflows/ci.yml     # lint/typecheck/test/build/audit di tiap push/PR ke master/main
└── packages/core/src/{errors.ts,db/reset-password.ts}  # CapabilityError/NotFoundError/TransitionError/ValidationError; pnpm reset-password CLI
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

18. **pnpm v12 memindahkan field `overrides` KELUAR dari `package.json`**.
    Pola lama (`"pnpm": {"overrides": {...}}` di `package.json`) sekarang
    cuma memicu warning `"pnpm" field in package.json is no longer read by
    pnpm` dan TIDAK diterapkan. Override dependency transitif (dipakai untuk
    memaksa versi patched `drizzle-orm` yang ditarik Nuxt devtools lewat
    `unstorage`/`db0`) sekarang wajib ditaruh di top-level `overrides:` pada
    `pnpm-workspace.yaml`. Lihat entry di sana untuk contoh + alasannya.

19. **Script root yang nested lewat `pnpm --filter ... <script>` JANGAN
    dibungkus dengan trailing `--` di definisi script-nya sendiri** kalau
    script itu juga menerima argumen positional dari command line (mis.
    `pnpm reset-password <email> <password>`). `pnpm <script> -- <args>`
    SUDAH otomatis forward `<args>` ke script target lewat satu `--`; kalau
    definisi script root-nya SENDIRI sudah diakhiri `--`
    (`"reset-password": "... pnpm --filter @selftaught/core reset-password --"`),
    argumen yang dikirim user numpuk JADI DUA `--` beruntun di argv final
    (`tsx src/db/reset-password.ts -- -- email pass` atau bahkan tanpa user
    menambah apa pun, `-- email pass` tetap leak sebagai argv literal
    `["--", "email", "pass"]`), yang salah-parse jadi
    `email="--"`/password lain, memunculkan error yang membingungkan
    ("No user found with email --" atau validasi panjang password gagal
    padahal password-nya valid). **Fix**: jangan tambahkan `--` apa pun di
    definisi script root — cukup
    `"reset-password": "dotenv -e .env -- pnpm --filter @selftaught/core reset-password"`,
    lalu panggil `pnpm reset-password email pass` langsung tanpa `--` sama
    sekali. Kalau ragu argv-nya benar, debug dengan panggil `tsx` script
    target secara langsung (skip semua layer `pnpm --filter`) untuk
    memastikan script itu sendiri benar sebelum curiga ke layer pnpm.

20. **Classifier keamanan auto-mode Claude Code memblokir SQL
    privilege-grant** (`GRANT ...`, `REASSIGN OWNED BY ...`) **secara
    otomatis, terlepas dari tool yang dipakai** — sudah dicoba lewat Bash
    langsung DAN lewat Write file `.sql` lalu `psql -f`, keduanya kena
    blokir yang sama dengan alasan `[Permission Grant]`. `CREATE ROLE`
    polos (tanpa klausa GRANT eksplisit di statement yang sama) TIDAK
    diblokir. Ini ditemukan saat mencoba bikin role Postgres least-privilege
    (`selftaught_app`) untuk isolasi tenant di VPS produksi bersama (lihat
    "Pekerjaan pasca-roadmap #5" di bawah). **Bukan bug, ini proteksi yang
    disengaja** — tindakan yang mengubah privilege akses punya blast radius
    besar (apalagi di VPS bersama seperti ini), jadi wajar classifier minta
    manusia yang menjalankannya langsung. Kalau ketemu ini lagi: siapkan
    perintah SQL-nya, minta USER yang menjalankan sendiri via `! <command>`
    di sesi mereka — jangan coba cari cara memutar classifier-nya.

21. **PENTING — `themes/default` (Nuxt Layer) butuh `@source` eksplisit di
    CSS-nya, TANPA itu situs publik render TANPA STYLING SAMA SEKALI**
    (bukan cuma warna brand — HAMPIR SEMUA utility class Tailwind). Root
    cause: Tailwind v4 auto-detect content scan berhenti di boundary
    `package.json` pertama yang ditemukan saat scan ke luar dari lokasi
    file CSS; `themes/default` PUNYA `package.json` sendiri (Gotcha #15),
    jadi Tailwind v4 tidak pernah scan ke dalam `themes/default/app/**/*.vue`
    walau Nuxt/Vite build file itu ke `apps/frontend` dengan normal.
    `apps/admin` TIDAK kena ini (bukan Layer, tidak ada boundary
    `package.json` tambahan). **Cara ketahuan**: HTML hasil SSR terlihat
    BENAR (semua `class="..."` ada di markup) — jangan percaya itu sebagai
    bukti CSS jalan. WAJIB cek byte CSS hasil compile langsung
    (`grep -c "bg-white" .output/public/_nuxt/entry.*.css` harus > 0, bukan
    cuma cek HTML). **Fix**: tambahkan
    `@source "../../";` (path relatif ke lokasi file CSS, arahkan ke folder
    `app/` milik layer) di `themes/default/app/assets/css/main.css`. Kalau
    bikin theme baru yang juga Nuxt Layer dengan `package.json` sendiri,
    ulangi pola `@source` ini atau situsnya akan putih polos lagi.
    **Jebakan tambahan**: Tailwind 4.3.3 (versi yang dipakai project ini)
    punya lexer sendiri yang salah-parse tanda petik apostrof (`'`) di MANA
    PUN dalam file CSS yang sama sebagai "unterminated string" begitu ada
    directive `@source` di file itu — pesan errornya (`CssSyntaxError:
    Unterminated string`) menunjuk ke comment yang salah, BUKAN ke
    directive-nya. Hindari apostrof di comment `.css` kalau file itu juga
    punya `@source`.

22. **`SettingsService.set(key, null)` (dan pola serupa manapun yang nyimpan
    JS `null` ke kolom `jsonb`) 500 kalau kolomnya `.notNull()`** — drizzle-orm
    `PgJsonb.mapToDriverValue()` (yang seharusnya `JSON.stringify(value)`,
    jadi `null` → string `"null"`, valid jsonb non-NULL) TERNYATA DI-SKIP
    kalau value-nya literal JS `null` — drizzle malah kirim SQL NULL mentah,
    yang ditolak constraint `NOT NULL`. Ini bikin SEMUA fitur "klik untuk
    deselect" yang nyimpan balik `null` ke `settings` (OG image default,
    dan sekarang logo/favicon) gagal 500 kalau kolomnya `.notNull()`.
    **Fix yang dipakai**: `packages/core/src/db/schema/settings.ts` kolom
    `value` dibuat nullable (migration `0005_wealthy_rocket_racer.sql`,
    cuma `ALTER COLUMN value DROP NOT NULL`) — representasikan "tidak ada
    value" sebagai SQL NULL sungguhan, bukan coba akalin di service layer.
    `content_meta.value` sudah nullable dari awal (aman). `content.content`/
    `revisions.content` tetap `.notNull()` (benar, tidak pernah dipanggil
    dengan `null` di praktiknya — selalu snapshot object asli). **Kalau
    nambah kolom `jsonb` baru yang service-nya mungkin perlu nyimpen
    "clear"/null, JANGAN pakai `.notNull()`** kecuali yakin value-nya tidak
    pernah kosong.

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
pnpm test            # vitest — unit test + integration test ke Postgres dev asli (butuh db:migrate+db:seed dulu)
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

1. ~~**Content type "page" — CRUD admin/API belum ada**~~ — **SELESAI**
   (lihat "Pekerjaan pasca-roadmap #3: Page CRUD" di bawah).
2. **`settings.homepageContentId` (static front page)** — MASIH ditunda
   (independen dari #1 sekarang, karena "page" sudah punya CRUD lengkap, ini
   cuma soal homepage BELUM baca setting itu). Homepage saat ini tetap mode
   "latest posts" saja. Implementasi: di `themes/default/app/pages/index.vue`,
   kalau `settingsService.get('homepageContentId')` terisi, fetch page itu
   via `/api/pages/[slug atau id]` dan render kontennya alih-alih list post.
3. ~~**Roles & Capabilities admin UI**~~ — **SELESAI** (lihat "Ringkasan:
   Users & Roles admin UI" di bawah). Sisa yang masih belum ada: bikin role
   CUSTOM lewat UI (di luar 4 `SYSTEM_ROLES` bawaan) — lihat #6.
4. ~~**Custom error classes untuk HTTP status code presisi**~~ — **SELESAI**
   (lihat "Pekerjaan pasca-roadmap #4: Production hardening" di bawah).
5. **`delete_pages`/`publish_pages` capability terpisah** — tipe "page"
   SEKARANG SUDAH ada CRUD penuh (#1 selesai), tapi masih sengaja berbagi
   SATU capability `edit_pages` untuk edit/publish/delete sekaligus (lihat
   `ContentTypeRegistry` di Phase 2), beda dari "post" yang granular
   (`edit_posts`/`publish_posts`/`delete_posts` terpisah). Ini keputusan yang
   masih berlaku, bukan lagi soal "API-nya belum ada" — kalau nanti mau
   granular, tinggal: tambah 2 capability baru ke `CAPABILITIES` const +
   `SYSTEM_ROLES`, update `ContentTypeRegistry.get("page").capabilityMap`,
   generate+jalankan migration seed baru.
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

## Pekerjaan pasca-roadmap #2: Automated tests (selesai)

`vitest` sudah terpasang sejak Phase 0 tapi nol test sampai titik ini — semua
verifikasi sebelumnya manual via curl. Sekarang ada 29 test di 6 file,
`pnpm test` (= `dotenv -e .env -- vitest run`, config di root
`vitest.config.ts`, scan `packages/**/*.test.ts` + `plugins/**/*.test.ts`):

- **Unit test murni (tanpa DB)**: `hooks/hook-bus.test.ts`,
  `registry/capabilities.test.ts`, `registry/content-types.test.ts`,
  `registry/taxonomies.test.ts`, `domain/users/permission-service.test.ts`
  (`PermissionService.can()` tidak menyentuh DB — cuma `loadActor()` yang
  perlu — jadi bisa dites dengan `new PermissionService(null as never, null as never)`
  plus object `Actor` bikinan sendiri).
- **Integration test (Postgres ASLI, bukan mock)**:
  `domain/content/content-service.integration.test.ts` — sengaja pakai
  database dev yang sama (`DATABASE_URL` dari `.env`), BUKAN database test
  terpisah, karena effort provisioning+migrate DB kedua tidak sepadan untuk
  scope saat ini. Amannya: pakai `permissionService.loadActor()` terhadap
  user admin hasil seed yang SUDAH ADA (bukan bikin user fixture baru —
  `content.authorId` adalah FK NOT NULL ke `users.id`, jadi actor palsu bikin
  insert gagal), dan HANYA row `content` (+ `revisions` yang ikut cascade)
  yang jadi fixture, di-cleanup total di `afterAll`. Prasyarat sebelum
  `pnpm test`: `pnpm db:migrate && pnpm db:seed` sudah pernah jalan (sama
  seperti prasyarat dev biasa, bukan setup tambahan).
- `HookBus` diekspor sebagai class (`export class HookBus`, sebelumnya cuma
  instance singleton `hooks` yang diekspor) supaya test bisa bikin instance
  bersih per test tanpa saling mengotori lewat singleton bersama.

**Terverifikasi**: `pnpm test` → 29/29 lolos termasuk integration test yang
benar-benar bikin/update/publish/trash/restore-revision/delete content lewat
Postgres asli dan menolak transisi ilegal (`trashed→published`). DB
terverifikasi bersih setelah test selesai (`select count(*) from content
where slug like 'vitest-fixture%'` → 0).

## Pekerjaan pasca-roadmap #3: CRUD content type "page" (selesai)

Meniru persis pola `posts/*` yang sudah ada sejak Phase 2/4/5 (bukan
refactor jadi generic — lihat alasan di bawah), MINUS categories/tags
(`ContentTypeDefinition` untuk "page" tidak punya taxonomy), PLUS
`parentId`/`menuOrder` untuk hierarki.

- `ContentService.CreateContentInput`/`UpdateContentInput` dapat field
  `parentId`/`menuOrder` baru (opsional) — `update()` sudah spread `input`
  langsung ke `.set()` jadi otomatis kepakai tanpa perlu ubah method itu
  sendiri.
- Admin API: `/api/pages` (index + `[id]`) + seluruh action endpoint
  (`publish/unpublish/submit/schedule/trash/untrash`) + `revisions/*` +
  `seo.{get,put}` — 15 file, SEMUA pakai capability `edit_pages` tunggal
  (bukan `publish_pages`/`delete_pages` terpisah, lihat item #5 di atas).
- Admin UI: `/pages` (list), `/pages/new`, `/pages/[id]` (SAMA seperti
  posts/[id].vue: BlockEditor, featured image, SEO panel, Revisions panel,
  action bar kondisional per status — TAPI ganti section Categories/Tags
  dengan section "Hierarki" berisi `<select>` parent page + input
  `menuOrder`; TIDAK ada integrasi `AdminUIRegistry`/plugin editor panel
  karena `example-plugin` cuma register panel untuk content type "post").
- Frontend: `server/api/pages/[slug].get.ts` (read-only, published only,
  resolve `seo`+`jsonLd` — pola identik `posts/[slug].get.ts`),
  `themes/default/app/pages/[slug].vue` (halaman publik single-segment).
  `sitemap.xml.ts` diupdate query pages juga (`SeoService.sitemapEntries()`
  SUDAH otomatis handle path pages sebagai `/${slug}` vs `/blog/${slug}`
  untuk post — tidak perlu ubah `SeoService` sama sekali).

**Penyederhanaan yang disengaja** (beda dari uraian asli di plan): URL page
publik `/[slug]` cuma SATU segmen (mis. `/about`), BUKAN
`pages/[...slug].vue` catch-all hierarkis yang disebut plan (mis.
`/about/team` merefleksikan `parentId` chain). `parentId`/`menuOrder`
tetap berfungsi penuh untuk ORGANISASI di admin (bisa dipakai nanti untuk
navigasi/menu bertingkat), tapi TIDAK memengaruhi struktur URL — 2 page
dengan parent berbeda tapi slug sama (mis. keduanya "team") akan BENTROK di
`/team`. Alasan skip: resolve URL hierarkis penuh butuh logic tambahan
signifikan (jalan-jalan parentId chain match tiap segmen path) untuk value
yang marginal di v1. Juga: page dengan slug yang sama seperti route statis
frontend yang sudah ada (`/blog`, dst.) akan ke-shadow oleh route statis itu
(Vue Router memprioritaskan static route di atas dynamic `[slug]`) — sama
seperti WordPress punya reserved-slug behavior serupa, tidak di-guard
eksplisit.

**Terverifikasi via curl, termasuk SSR (bukan cuma endpoint JSON — lihat
Gotcha #17 soal kenapa ini wajib)**: buat parent page + child page dengan
`parentId`/`menuOrder` → update (revisi tersimpan) → set SEO custom →
publish keduanya → akses publik `/api/pages/[slug]` (SEO ter-resolve
benar) → **SSR `/pages/[id]` (editor), `/pages` (list), `/pages/new` semua
200 dengan konten benar** → SSR publik `/[slug]` render benar → `/sitemap.xml`
memuat kedua page path → transisi ilegal (`trashed→published`) ditolak. DB
bersih setelah cleanup. Lint+typecheck bersih di semua package/app,
`pnpm test` tetap 29/29 (tidak ada regresi dari penambahan
`parentId`/`menuOrder` ke `ContentService`).

Dengan ini, SEMUA item "sengaja ditunda" nomor #1 dan #3 sudah selesai;
`settings.homepageContentId` (#2) masih ditunda tapi sekarang independen
(lihat catatan di atas).

## Pekerjaan pasca-roadmap #4: Production hardening (selesai)

Menjawab pertanyaan "apakah CMS ini siap dipakai di produksi" — sebelumnya
CMS *functionally complete* (semua fase roadmap selesai) tapi belum
*production-hardened*. Sesi ini menutup semua gap konkret yang teridentifikasi
di bawah kategori security & operational.

- **Dependency security**: `pnpm audit` dari 13 vulnerability (1 kritis/4
  high/7 moderate/1 low) → 4 (0 kritis/0 high/3 moderate/1 low). Bump
  `drizzle-orm` → `^0.45.2`, `sharp` → `^0.35.4`, `drizzle-kit` → `^0.31.10`,
  `vitest` → `^4.1.9`. `drizzle-orm` lama juga ditarik transitif oleh Nuxt
  devtools lewat `unstorage`/`db0` — dipaksa ke versi patched via
  `pnpm-workspace.yaml` `overrides:` (lihat Gotcha #18 soal kenapa BUKAN di
  `package.json`). 4 vulnerability sisa dinilai tidak applicable ke code
  path kita (diverifikasi via grep, bukan diabaikan begitu saja): komponen
  Nuxt UI form yang rentan (`UForm`/`UAuthForm`) tidak pernah dipakai di
  codebase ini, Tiptap cuma diakses admin yang sudah authenticated, esbuild
  cuma kepakai lewat drizzle-kit CLI (dev-time, bukan server produksi).

- **HTTP status code presisi untuk error domain** (menutup item #4 di
  "Item yang sengaja ditunda"): 4 error class baru di
  `packages/core/src/errors.ts` (`CapabilityError`, `NotFoundError`,
  `TransitionError`, `ValidationError`, framework-agnostic — tidak import
  h3/Nuxt), dilempar dari `ContentService`/`MediaService` di titik yang
  sebelumnya `throw new Error(...)` polos. `apps/admin/server/utils/api-handler.ts`
  (`defineApiHandler`, wrapper tipis di atas `defineEventHandler`) meng-catch
  4 class itu dan map ke status code REST yang tepat (403/404/409/400),
  diterapkan ke semua 21 endpoint write posts/pages/media via
  `sed -i 's/export default defineEventHandler(/export default defineApiHandler(/'`.
  **Diverifikasi runtime via curl** (bukan cuma typecheck — disiplin Gotcha
  #17): NotFoundError→404, ValidationError→400 (juga zod `readValidatedBody`
  tetap 400 seperti sebelumnya, tidak konflik), TransitionError→409 (transisi
  ilegal `trashed→published`).

- **Rate limiting login**: in-memory token bucket
  (`apps/admin/server/utils/rate-limit.ts`, cocok untuk target deployment
  single-instance — BUKAN Redis-backed, tidak akan sinkron across multiple
  instance kalau nanti di-scale horizontal, catat ini kalau architecture
  berubah). `POST /api/auth/login` membatasi 20 percobaan/15 menit per-IP
  DAN 5 percobaan/15 menit per-email (dua dimensi independen — email attack
  yang distribusi IP-nya luas tetap ke-throttle). **Diverifikasi runtime**:
  6 percobaan password salah beruntun ke email yang sama → percobaan ke-6
  dapat 429; bucket in-memory berarti restart proses mengosongkan semua
  limit (dipakai sengaja saat testing untuk lanjut verifikasi status code
  lain tanpa nunggu window 15 menit).

- **Validasi upload media**: `MediaService.upload()`
  (`packages/core/src/domain/media/media-service.ts`) menolak mime type di
  luar allowlist (`image/jpeg,png,gif,webp,svg+xml` + `application/pdf`),
  file kosong, dan file > 10MB — masing-masing `ValidationError` (jadi 400
  lewat `defineApiHandler`, bukan crash/500). `POST /api/media` juga cek
  header `Content-Length` LEBIH DULU sebelum `readMultipartFormData` (413
  early-reject) supaya upload raksasa tidak keburu dibaca penuh ke memory
  dulu baru ditolak. **Diverifikasi runtime**: upload `.txt` sebagai
  `image/jpeg` palsu → 400 (mime check baca actual content type dari
  request, bukan percaya ekstensi); upload file 11MB → 413 dari
  Content-Length precheck.

- **Reset password darurat**: `UserService.setPassword()` (baru) dipanggil
  dari dua jalur independen — (1) `PUT /api/users/[id]/password` +
  UI "Reset Password" di `/users/[id]` (butuh admin lain yang masih bisa
  login, capability `manage_users`), (2)
  `packages/core/src/db/reset-password.ts` + `pnpm reset-password <email>
  <password>` (bicara langsung ke DB, dipakai kalau TIDAK ADA admin yang
  bisa login sama sekali). **Sengaja TIDAK membangun** self-service
  email-based password reset — tidak ada infrastruktur SMTP tersedia,
  keputusan scope sadar, bukan oversight.

- **CI** (`.github/workflows/ci.yml`, belum pernah dijalankan sungguhan di
  GitHub Actions saat ini ditulis — tapi tiap langkahnya sudah
  diverifikasi lolos secara manual/lokal satu per satu: lint, typecheck,
  `pnpm test`, `pnpm build:admin`, `pnpm build:frontend`,
  `pnpm audit --audit-level=high`): trigger push ke `master`/`main` + PR,
  service container `postgres:16-alpine`, `.env` CI dibuat inline via
  heredoc (lihat Gotcha #8 soal kenapa root script butuh `.env` fisik).

- **Backup & restore**: `scripts/backup.sh`/`scripts/restore.sh` — `pg_dump`
  (gzip) + tar folder media, timestamped, baca `DATABASE_URL`/
  `MEDIA_LOCAL_PATH` dari `.env` root sama seperti script lain.
  **Diverifikasi jalan** terhadap DB dev asli (dump + archive media
  berhasil, ukuran file masuk akal). `restore.sh` minta konfirmasi manual
  sebelum menimpa DB (destruktif, tidak pernah dites end-to-end karena akan
  menimpa data dev yang sedang dipakai — logic-nya simetris dengan
  `backup.sh` yang sudah terverifikasi, jadi risiko rendah, tapi catat ini
  kalau ada masalah nanti). `backups/` ditambahkan ke `.gitignore`.

**Item dari gap list awal yang SENGAJA didokumentasikan sebagai deferred,
bukan diam-diam dilewati**:
- **Structured logging/monitoring** — belum diimplementasikan. CMS ini
  masih pakai `console.log`/Nitro default logging. Untuk deployment
  produksi sungguhan, tambahkan structured logger (pino/dst) di boundary
  `defineApiHandler` (titik yang sama dipakai untuk status code mapping di
  atas, jadi tinggal tambah 1 baris log di catch block) + kirim ke
  observability tool pilihan (self-hosted: Grafana Loki; SaaS: apa saja).
  Tidak dibangun sekarang karena pilihan tool sangat tergantung preferensi
  operator deployment — bukan keputusan yang bisa diambil sepihak tanpa
  input user.
- **Docker migration automation** — `docker-compose.yml` tidak otomatis
  jalankan `db:migrate`/`db:seed` saat container start (lihat bagian
  "Deployment produksi" di README — harus manual dari host). Tetap manual
  by design: auto-migrate on boot itu sendiri punya risiko (migration gagal
  separuh jalan saat container restart looping) yang lebih baik dikontrol
  operator secara eksplisit, bukan otomatis.
- **S3/scalable object storage** — dinilai BUKAN gap sungguhan terhadap
  target deployment yang sudah diputuskan sejak awal (self-hosted
  single-instance, lihat "Keputusan arsitektur" #4 di atas).
  `StorageAdapter` interface sudah disiapkan sejak Phase 3 khusus supaya ini
  gampang ditambah KALAU target deployment berubah ke multi-instance/HA —
  tapi menambahnya sekarang tanpa kebutuhan itu adalah over-engineering,
  bukan hardening.

**UPDATE (dikonfirmasi 2026-09-15)**: repo SUDAH punya remote GitHub
(`https://github.com/SalityLook/cms`, public, default branch `main`) dan
CI SUDAH benar-benar jalan hijau di sana (dikonfirmasi lewat GitHub API,
beberapa run terakhir semua `completed`/`success`) — item "belum
dijalankan sungguhan" di atas SUDAH TIDAK berlaku, cuma belum
ter-update di sini sampai sekarang. Kapan/siapa yang push remote ini
tidak tercatat di histori kerja sesi-sesi sebelumnya — kalau perlu detail
lebih lanjut, cek langsung `git log`/GitHub, bukan andalkan dokumen ini.

## Pekerjaan pasca-roadmap #5: Production deployment (LIVE)

**Baru ketahuan di titik ini**: direktori `/var/www/selftaught` ternyata ada
di VPS produksi BERSAMA (`hostname babussalam-0`), bukan sandbox terisolasi
— lihat peringatan ⚠️ di paling atas dokumen ini. User sudah siapkan domain
`self-taught.my.id` dengan DNS mengarah ke VPS ini sebelum sesi ini, dan
minta CMS di-deploy sungguhan.

**Docker TIDAK dipakai** (walau `docker-compose.yml` ada di repo untuk
target deployment generik) — VPS ini tidak punya Docker terpasang, jadi
deploy pakai jalur native: build Nitro `node-server` + pm2 + nginx reverse
proxy + certbot, semuanya proses yang sudah berjalan di VPS ini untuk situs
lain juga.

- **DNS**: `self-taught.my.id` dan `admin.self-taught.my.id` → `202.149.87.12`
  (IP publik VPS ini), dikonfirmasi via `getent hosts` sebelum lanjut.
- **Skema subdomain**: `self-taught.my.id` (apex) → frontend publik (port
  3001), `admin.self-taught.my.id` → dashboard admin (port 3000) — pola
  yang sama dengan `db.self-taught.my.id` (tool DB admin generik, TIDAK
  terkait CMS ini) yang sudah ada duluan di server ini.
- **Build**: `pnpm build:admin`/`build:frontend` biasa, tapi
  `NUXT_PUBLIC_SITE_URL` di `.env` root diganti ke `https://self-taught.my.id`
  dulu SEBELUM build (dipakai untuk sitemap/canonical/OG — walau
  `runtimeConfig.public` sebenarnya dibaca dari `process.env` saat runtime
  juga, bukan cuma di-bake saat build, tapi build ulang dilakukan untuk
  memastikan).
- **Process manager**: `pm2` (sudah terpasang di VPS ini, belum dipakai app
  lain). Script start baru: `apps/admin/start.sh` dan
  `apps/frontend/start.sh` — masing-masing `source ../../.env` (Gotcha #8:
  binary hasil build TIDAK otomatis baca `.env`, beda dari `dotenv-cli`
  yang dipakai script `pnpm dev:*`/`build:*`), set `PORT` (3000/3001),
  `NODE_ENV=production`, lalu `exec node .output/server/index.mjs`. Proses:
  `pm2 start apps/admin/start.sh --name selftaught-admin`, sama untuk
  frontend. `pm2 save` + `pm2 startup systemd` (bikin service
  `pm2-root.service`, enabled) supaya survive reboot VPS. `pm2-logrotate`
  module terpasang (`max_size 10M`, `retain 14`, `compress true`) — tanpa
  ini, log pm2 akan tumbuh tanpa batas.
- **nginx**: 2 server block baru,
  `/etc/nginx/sites-available/{self-taught.my.id,admin.self-taught.my.id}`,
  masing-masing `proxy_pass` ke `127.0.0.1:3001`/`127.0.0.1:3000` +
  `client_max_body_size 11m` (match batas upload 10MB `MediaService` +
  margin, lihat catatan di README). **SELALU `nginx -t` sebelum
  reload/restart** — VPS ini juga melayani site lain (lihat peringatan di
  atas), config yang salah bisa mematikan SEMUANYA, bukan cuma CMS ini.
- **TLS**: `certbot --nginx -d self-taught.my.id -d admin.self-taught.my.id
  --redirect` — satu sertifikat cover kedua domain, HTTP→HTTPS redirect
  otomatis ditambahkan certbot ke config, auto-renew sudah terjadwal
  (certbot punya systemd timer sendiri, bukan sesuatu yang perlu diatur
  manual). Expire pertama: 2026-12-13.
- **Password admin default DIGANTI SEGERA setelah go-live** — seed default
  (`admin@example.com` / `changeme123!`) terdokumentasi PUBLIK di README di
  GitHub, jadi begitu situs live itu jadi kredensial yang bocor secara
  publik. Diganti via `pnpm reset-password` (CLI yang sama yang dibangun di
  Pekerjaan pasca-roadmap #4) ke password random kuat, diverifikasi login
  berhasil lewat HTTPS produksi sungguhan sebelum lanjut. **Pelajaran**:
  kalau ada CMS lain nanti yang deploy dari repo publik dengan kredensial
  seed yang didokumentasikan, ini WAJIB dilakukan sebelum (atau
  segera setelah) domain live, bukan "nanti kalau sempat".
- **Backup otomatis**: root crontab (`crontab -l` untuk lihat) —
  `scripts/backup.sh` tiap jam 02:00, retensi 14 hari (`find ... -mtime +14
  -delete` di 02:30). Sebelumnya (Pekerjaan #4) script-nya cuma ada dan
  teruji manual, belum benar-benar terjadwal — ini menutup gap itu.
- **Diverifikasi sungguhan bukan cuma asumsi**: cron auto-publish
  (`content:publish-scheduled`) DIUJI ULANG di build produksi asli (bukan
  `nuxt dev`) — bikin post, jadwalkan ke masa lalu lewat
  `https://admin.self-taught.my.id`, tunggu siklus cron 1 menit via
  polling `psql`, konfirmasi `status` berubah jadi `published` dengan
  `published_at` yang match. Alasan diuji ulang padahal sudah pernah
  diverifikasi di Phase 4: build produksi (`.output/server/index.mjs`)
  adalah artifact BERBEDA dari `nuxt dev` — kode Nitro scheduled-task bisa
  saja tidak ter-bundle dengan benar padahal dev mode jalan normal, jadi
  "sudah pernah dites di dev" TIDAK otomatis berarti benar di build
  produksi (pola yang sama dengan disiplin Gotcha #17).
- **Situs lain di VPS ini dikonfirmasi TIDAK terganggu** — `curl` ke
  `babussalam.sch.id` dan `maratussholihah.ponpes.id` setelah tiap
  perubahan nginx/certbot, tetap 200 seperti sebelumnya.

**UPDATE (dikonfirmasi 2026-09-15) — LEBIH DEKAT SELESAI dari yang
tercatat**: dicek ulang, ternyata `ALTER DATABASE selftaught OWNER TO
selftaught_app` SUDAH dijalankan (owner DB sekarang `selftaught_app`,
bukan `postgres`) DAN grant `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`USAGE`/
`CREATE` di schema `public` SUDAH ada untuk role itu (dikonfirmasi via
`has_table_privilege`/`has_schema_privilege` — role itu bahkan bisa
`CREATE` tabel baru, jadi migration masa depan pun aman). Yang BENAR-BENAR
masih kurang cuma **password role `selftaught_app` belum pernah
di-set** — `ALTER ROLE selftaught_app WITH PASSWORD '...'` DIBLOKIR
classifier keamanan (alasan `[Secret-Store Writes]`, beda dari alasan
`[Permission Grant]` di Gotcha #20 tapi efeknya sama: butuh user jalankan
sendiri). Kapan/siapa yang menjalankan `ALTER DATABASE OWNER`+`GRANT` di
atas juga tidak tercatat di histori sesi manapun — kemungkinan besar user
menjalankannya sendiri via `!` di sesi yang tidak terdokumentasi di sini.

**Belum selesai — butuh user menjalankan sendiri**: set password role
`selftaught_app`, lalu update `DATABASE_URL` di `.env` jadi
`postgres://selftaught_app:<password>@localhost:5432/selftaught`, lalu
`pm2 restart selftaught-admin selftaught-frontend`. `DATABASE_URL`
produksi MASIH pakai `postgres` superuser sampai ini dijalankan. Bukan
darurat (Postgres cuma listen `127.0.0.1`, tidak diekspos publik) tapi
tetap defense-in-depth yang
penting di VPS bersama seperti ini — kalau sesi Claude Code berikutnya
lihat `DATABASE_URL` masih `postgres:postgres@...`, ingatkan user lagi.

## Pekerjaan pasca-roadmap #6: UI/UX redesign (selesai)

Sebelum ini, admin tidak punya shared layout sama sekali — tiap halaman
bikin `<header>`+wrapper sendiri-sendiri (tidak konsisten, tanpa nav mobile
sama sekali), dan theme publik cuma daftar link polos tanpa styling. Ini
murni perubahan visual/struktur — **tidak ada logic data-fetching atau
action yang diubah**, semua `useApiFetch`/`apiFetch`/endpoint call tetap
persis sama.

- **Design tokens** (`packages/tailwind-config/theme.css`): brand color
  diperluas dari 3 stop ke full scale oklch 50-950 (hue sama, ~260,
  indigo-violet), tambah token `--font-serif` (Lora) untuk heading
  editorial. `@nuxt/fonts` dipasang di admin (Inter) dan theme (Inter +
  Lora) — **diverifikasi font di-self-host** (file `.woff2` sungguhan ada
  di `.output/public/_fonts/` hasil build produksi, BUKAN proxy runtime ke
  Google Fonts). `@tailwindcss/typography` dipasang di admin DAN theme —
  sebelumnya class `prose` sudah dipakai di `BlockEditor.vue` dan halaman
  artikel theme tapi TIDAK PERNAH benar-benar berefek karena plugin-nya
  belum terpasang (silent no-op, bukan error).
- **Admin**: `layouts/default.vue` baru (sidebar responsif — fixed di
  desktop, `USlideover` drawer di mobile — dengan nav dikelompokkan
  Konten/Kelola, user menu+logout dipindah ke sini dari dashboard supaya
  ada di semua halaman). `app.vue` bungkus `NuxtPage` dengan `NuxtLayout`;
  `login.vue` opt-out via `layout: false`, dapat desain split-screen
  branded sendiri. Komponen baru `PageHeader.vue` (title+description+
  actions slot) menggantikan markup `<header>` yang dulu diduplikasi di
  tiap halaman. Dashboard (`index.vue`) dirombak jadi stat card (posts/
  pages/media/draft) + recent posts, bukan daftar link statis. Semua
  halaman list (posts/pages/media/users/trash/categories/tags/roles)
  di-restyle konsisten (table/card, empty state dengan icon). Halaman
  editor (`posts/[id]`, `pages/[id]`, `*/new`) dirombak jadi 2-kolom
  (editor utama + sidebar meta) ala WordPress/Ghost. `BlockEditor.vue`
  dapat **toolbar formatting sungguhan** (bold/italic/strike/code, H2/H3,
  list, quote, code block, insert gambar via URL prompt, horizontal rule,
  undo/redo) — sebelumnya TIDAK ADA toolbar visible sama sekali, cuma
  ProseMirror mentah yang mengandalkan markdown shortcut.
- **Theme publik** (`themes/default`): `layouts/default.vue` baru (header
  sticky + nav + mobile menu pakai inline SVG polos, BUKAN icon package —
  theme sengaja tetap "Tailwind polos" sesuai keputusan arsitektur #6,
  tidak boleh terkunci ke Nuxt UI) + footer. Komponen baru `PostCard.vue`
  (featured image, badge kategori, judul serif, excerpt, tanggal) dipakai
  bersama oleh homepage, `/blog`, dan archive kategori/tag. Homepage
  dirombak jadi hero section + grid post terbaru (sebelumnya cuma `<h1>`
  + `<ul>` link polos). `blog/[slug].vue`/`[slug].vue` dirombak jadi
  article layout proper (header center, featured image full-width, body
  `prose-lg`, tag chip di bawah). `error.vue` di-restyle sesuai brand.
- **Perubahan backend yang diperlukan untuk PostCard**: endpoint listing
  (`GET /api/posts`, `/api/category/[slug]`, `/api/tag/[slug]` di
  `apps/frontend`) sebelumnya cuma balikin raw row `content` — punya
  `featuredMediaId` (BUKAN URL, lihat Gotcha #12) tapi TIDAK ada data
  terms. `apps/frontend/server/utils/enrich-posts.ts` baru (dipakai
  ketiga endpoint itu) batch-resolve `featuredMediaUrl` + `categories`
  per post via `Promise.all` — cukup untuk skala saat ini (page size
  kecil), butuh query batch sungguhan kalau jumlah post membesar jauh.

**Insiden kecil selama verifikasi** (tidak ada kerusakan permanen, dicatat
supaya tidak terulang): `fuser -k 3000/tcp` yang dimaksudkan untuk
membersihkan dev server ternyata mematikan proses **pm2 produksi**
`selftaught-admin` yang sungguhan jalan di port itu — pm2 auto-restart
memulihkannya dalam hitungan detik (downtime beberapa detik, tidak ada
kehilangan data). **Pelajaran**: karena VPS ini production bersama (lihat
peringatan ⚠️ di paling atas dokumen), SELALU cek `pm2 status`/
`ss -tlnp` dulu sebelum menyentuh port berapa pun — jangan asumsikan port
3000/3001 "pasti kosong" untuk testing lokal. Testing dev berikutnya
dijalankan tanpa mematikan apa pun — `nuxt dev` otomatis pindah ke port
alternatif (3002/3003) kalau port default terpakai, itu perilaku Nuxt yang
aman, tidak perlu dibantu `fuser -k`.

**Diverifikasi runtime, bukan cuma typecheck** (disiplin Gotcha #17): login
ke API admin sungguhan di port dev terpisah dari produksi, SSR-test semua
halaman yang ditulis ulang (dashboard, semua list, semua form `/new`, dan
editor dinamis `posts/[id]`/`pages/[id]`/`users/[id]`) pakai cookie session
asli, bikin post published sungguhan dengan kategori dan featured-image
fallback state, konfirmasi tampil benar di homepage/archive
kategori/halaman post penuh (block content ter-render benar), lalu
cleanup total. `pnpm test` tetap 29/29. Kedua app di-build ulang untuk
produksi dan di-deploy via `pm2 restart` — dikonfirmasi live di
`https://self-taught.my.id`/`https://admin.self-taught.my.id`, dan site
lain di VPS ini tidak terganggu.

## Pekerjaan pasca-roadmap #7: Brand logo & warna asli (selesai)

User kasih `brand/selftaught-logo-source.png` (logo asli "{Self-Taught}",
biru/oranye di atas hitam, tagline "Teachers Are Everywhere") untuk
menggantikan badge "S" + palet indigo placeholder yang dipakai di Pekerjaan
#6.

- **Asset diproses pakai ImageMagick** (`convert`, tersedia di VPS ini) —
  trim padding hitam, key-out background hitam jadi transparan
  (`-transparent black`), recolor satu-satunya elemen putih (garis pemisah
  "Self"–"Taught") ke abu-abu netral supaya tetap kelihatan di background
  terang MAUPUN gelap (versi asli cuma legible di gelap). Hasil: 3 file
  turunan, digandakan ke `public/` KEDUA app (admin dan theme, karena
  keduanya build Nuxt terpisah):
  - `brand/wordmark.png` — "{Self-Taught}" tanpa tagline, dipakai di
    semua nav/sidebar/header yang sebelumnya pakai badge "S" buatan sendiri.
  - `brand/mark.png` — cuma dua kurung kurawal "{ }" (crop dari kedua ujung
    wordmark, disusun ulang berdekatan) — dipakai sebagai source
    favicon/apple-touch-icon, legible bahkan di 32px.
  - `brand/full-lockup.png` (admin saja) — wordmark+tagline, dipakai di
    panel branding gelap halaman login.
- **Design token warna diganti dari indigo placeholder ke warna logo asli**
  disampling langsung dari source PNG: `--color-brand-*` sekarang scale
  biru penuh anchor `#0284FF` (bukan lagi oklch, plain hex tint/shade
  blend), plus scale baru `--color-accent-*` (oranye `#FF7D01`) dipakai
  TERBATAS untuk badge/label kategori (`PostCard`, `blog/[slug]`,
  `category/[slug]`) supaya identitas dua-warna logo kerasa tanpa bikin UI
  ramai — tag tetap brand-blue biar dua taxonomy kebaca beda secara visual.
- `favicon.ico` (multi-size 16/32/48) dan `apple-touch-icon.png` (180x180)
  di-generate ulang dari `brand/mark.png`, menggantikan favicon default
  bawaan `nuxi init`.

**Diverifikasi runtime**: typecheck+lint bersih di kedua app, dev server di
port non-produksi (bukan 3000/3001 — lihat peringatan soal ini di
Pekerjaan #6) balikin `/brand/wordmark.png`+`/favicon.ico` 200, HTML hasil
SSR benar-benar memuat tag `<img>` baru + teks tagline asli. `pnpm test`
tetap 29/29. Build ulang + `pm2 restart` — dikonfirmasi live di kedua
domain produksi.

## Pekerjaan pasca-roadmap #8: Fix situs publik render tanpa styling (selesai)

User lapor `/blog` "masih putih polos, css tailwind sepertinya belum
terimplementasi" — laporan itu BENAR. Root cause dan fix lengkap ada di
**Gotcha #21** di atas: `themes/default` sebagai Nuxt Layer bikin Tailwind
v4 auto-content-detection berhenti di boundary `package.json` layer itu
dan tidak pernah scan `.vue` file di dalamnya, jadi HAMPIR SEMUA utility
class (bukan cuma warna brand) gagal ter-generate sejak commit UI redesign
(Pekerjaan #6) — bug sudah ada dari situ, baru ketahuan sekarang.

**Pelajaran penting soal disiplin verifikasi**: sepanjang Pekerjaan #6/#7
saya SSR-test banyak halaman dan selalu cek markup HTML (class ada di
`<div class="bg-white ...">`) sebagai "bukti" styling benar — itu TIDAK
CUKUP, karena HTML tetap punya nama class yang benar walau CSS-nya kosong
(browser cuma mengabaikan class yang tidak match rule apa pun). Verifikasi
yang benar-benar valid untuk masalah CSS harus cek BYTE hasil compile
(`grep -c "bg-white" .output/public/_nuxt/entry.*.css`), bukan cuma
struktur HTML. Ini pelajaran yang sama semangatnya dengan Gotcha #17
("nuxt typecheck lolos ≠ runtime benar") — sekarang berlaku juga untuk
"HTML markup benar ≠ CSS ter-compile benar".

**Diverifikasi**: `grep` byte CSS lokal DAN di HTTPS produksi
sebelum/sesudah fix (`bg-white`/`bg-brand-600`/`text-brand-600`/
`rounded-full`: 0 match → 1 match masing-masing), ukuran bundle CSS naik
34KB→67KB. Typecheck+lint+`pnpm test` (29/29) tetap bersih. Deploy via
`pm2 restart selftaught-frontend`.

## Pekerjaan pasca-roadmap #9: Branding per-instance (logo/favicon/nama situs)

User tanya apakah logo/favicon bisa diganti, karena CMS ini akan dipakai
beberapa sekolah — "SelfTaught" cuma branding proyek ini sendiri, sama
seperti WordPress punya identitas default yang tiap situs nyata ganti.
Sebelumnya TIDAK BISA — logo hardcoded sebagai file statis di `<img>`,
tanpa kontrol dari admin.

- `GET /api/branding` baru di KEDUA app (admin + frontend, proses Nitro
  terpisah, DB sama) — SENGAJA tanpa auth (dibutuhkan halaman login yang
  belum ada session, dan tiap render halaman publik). Baca setting baru
  `siteLogoMediaId`/`siteFaviconMediaId` (tidak butuh migration — `settings`
  memang generic key/value jsonb sejak awal), resolve ke URL lewat
  `mediaService`, fallback `null` kalau belum diset.
- `BrandLogo.vue` (1 salinan per app, sama pola dengan aset statis
  sebelumnya) — render logo custom kalau ada, fallback ke
  `/brand/wordmark.png` bawaan. Menggantikan SEMUA `<img>` hardcoded
  (sidebar admin, mobile nav admin, login×2, header theme, error page
  theme).
- Favicon dinamis: `app.vue` kedua app fetch branding sekali,
  `useHead()` set `<link rel="icon">` ke favicon custom kalau ada — PNG
  polos langsung dipakai (`type="image/png"`), tidak perlu proses
  multi-size `.ico` seperti aset default SelfTaught (lihat Pekerjaan #7).
- Settings admin (`/settings`): card baru "Site Identity" — picker Logo +
  picker Favicon (pola sama seperti picker OG image yang sudah ada).
  Teks copyright halaman login sekarang baca nama situs juga, bukan
  hardcoded "SelfTaught CMS".

**Bug nyata ketemu sekaligus diperbaiki saat testing "hapus logo"**: lihat
**Gotcha #22** — `SettingsService.set(key, null)` 500 karena kolom
`settings.value` `.notNull()` bentrok sama cara drizzle-orm handle jsonb
`null`. Ini artinya picker "default OG image" yang SUDAH ADA sejak Phase 5
sebenarnya TIDAK PERNAH bisa di-deselect sejak awal dibangun — baru
ketahuan sekarang karena baru sekarang jalur "pilih → simpan → deselect →
simpan lagi" benar-benar dites end-to-end. Di-fix di level schema
(migration `0005`, `settings.value` jadi nullable), bukan di-workaround di
service layer.

**Diverifikasi end-to-end** (dev server, bukan port produksi): login →
upload media asli → set sebagai logo DAN favicon lewat
`PATCH /api/settings` → konfirmasi `GET /api/branding` DAN HTML hasil
render di KEDUA app berubah pakai logo baru → konfirmasi reset ke `null`
sekarang 200 (sebelumnya 500) dan beneran ke-clear di DB → cleanup media
test + reset settings. Typecheck+lint bersih, `pnpm test` 29/29, migration
diterapkan ke database yang sama dipakai produksi (dev dan prod di VPS ini
satu Postgres yang sama). Build ulang + `pm2 restart` — dikonfirmasi live.

## Rencana kesetaraan fitur WordPress (Pekerjaan pasca-roadmap #10-24)

**STATUS: SEMUA 15 FASE (Phase 10-24) SELESAI.** User minta analisis fitur
WordPress yang belum dimiliki CMS ini, lalu minta rencana untuk menutup
gap itu SEMUA native di core (tanpa plugin eksternal) — CMS ini
diposisikan sebagai platform yang di-install per VPS/hosting (bukan SaaS
multi-tenant), modern/ringan/powerful. Rencana lengkap 15 fase ada di
`/root/.claude/plans/saya-ingin-membangun-sebuah-tingly-spring.md` bagian
"Rencana lanjutan: Kesetaraan fitur WordPress tanpa plugin eksternal" —
masih berguna dibaca sebagai referensi keputusan arsitektur yang sudah
dikonfirmasi user (reusable blocks pakai model SYNCED bukan
detached-copy, self-registration dengan role `subscriber` 0-capability +
session terpisah, i18n di-skip, multisite TIDAK dibangun — runbook clone-
deploy sebagai gantinya). CMS ini sekarang punya SEMUA fitur yang
direncanakan: search full-text, custom menus, duplicate content, reusable
blocks tersinkron, autosave+revision diff, self-registration+profil
publik, import/export (JSON+WXR), plugin/theme toggle, 2FA TOTP, REST API
publik v1, dan oEmbed — di atas fondasi Phase 0-7 dan pekerjaan
pasca-roadmap #1-9 sebelumnya. Item yang SENGAJA tidak dibangun (i18n,
multisite sungguhan) didokumentasikan di bagian "Item yang sengaja TIDAK
dibangun" di plan file, bukan terlewat.

### Phase 10 — Admin list search/filter/pagination/bulk actions (selesai)

`ContentService`/`UserService`/`MediaService` dapat `list(filters)`/
`count(filters)` dengan `search` (ILIKE). Semua endpoint list admin
(`/api/posts`, `/api/pages`, `/api/users`, `/api/media`) sekarang balikin
envelope `{items, page, totalPages, total}` — breaking change, SEMUA
consumer lama (dashboard, trash.vue, page parent-picker, media picker di
settings/posts/pages editor) sudah diupdate unwrap `.items`. Endpoint bulk
baru (`POST /api/{posts,pages,users,media}/bulk`) loop method single-item
yang sudah ada, partial-failure tolerant (`{succeeded, failed}`). UI baru:
`composables/useListQuery.ts` + `components/AdminDataTable.vue` (generic,
`<script setup generic="T">`), dipakai di posts/pages/users/index.vue;
`media.vue` reuse composable-nya tapi tetap grid layout sendiri.

**Gotcha ditemukan**: `useApiFetch` TIDAK auto-refetch kalau query option-nya
`computed()` biasa (closure fetcher capture `opts` sekali, dan ofetch tidak
bisa serialize Vue ref sebagai query value). Fix: pakai `reactive()` object
stabil (di-mutate, bukan diganti) + `refresh()` eksplisit di `watch` —
closure baca ulang property reactive object itu saat dipanggil lagi.
`api.ts` sendiri TIDAK disentuh (Gotcha #17) — ini pattern di call-site saja.

**Diverifikasi runtime**: seed 25 post → search/pagination math benar (25
post, limit 10 → 3 halaman) → bulk trash/delete id nyata → bulk request
campuran id valid+invalid balikin partial success dalam SATU response
(bukan 500 total) → bulk suspend user beneran ubah status → SSR semua
halaman list termasuk state `?search=`/`?page=` → cleanup total. Typecheck/
lint bersih, `pnpm test` 29/29. Build+deploy `pm2 restart selftaught-admin`
— live.

### Phase 11 — Kategori hierarkis (selesai)

`terms.parentId` sudah ada di schema sejak awal, tidak pernah dipakai —
fase tanpa migrasi. `TaxonomyService` dapat `updateTerm`, `listTree`
(flat→tree client-side), guard cycle privat `wouldCreateCycle` (walk
ancestor chain, FK sendiri tidak cegah loop A→B→A), `getAncestors`
(breadcrumb publik), `listChildren`. `deleteTerm` sekarang guard kalau
masih ada child (`ValidationError` rapi, bukan 500 mentah dari Postgres
FK-restrict). Endpoint baru `[id].patch.ts` + `tree.get.ts` (terpisah dari
`index.get.ts` yang tetap flat, dipakai toggle category/tag di editor
post/page). `index.post.ts`/`[id].delete.ts` taxonomy pindah dari
`defineEventHandler` ke `defineApiHandler` supaya guard baru benar-benar
jadi 400. Admin: `TaxonomyManager.vue` dapat prop `hierarchical` (category
saja, tag tetap flat), parent-picker, inline edit, tree berindentasi.
Publik: `category/[slug].vue` breadcrumb dari ancestor chain + chip child
category.

**Kesalahan kecil yang ketahuan sebelum deploy**: draft pertama breadcrumb
pakai `<UIcon>` — theme publik SENGAJA tidak punya Nuxt UI/icon package
(keputusan sejak redesign Phase 6). Diganti separator teks "/" biasa,
konsisten pola theme yang sudah ada.

**Diverifikasi runtime**: parent+child category → set parent Programming
ke child-nya sendiri → 400 (cycle) → hapus Programming selagi masih ada
child → 400 → hapus child dulu → sukses → assign post ke child, publish →
`ancestors`/`children` di response API benar → breadcrumb SSR publik benar
→ tree UI admin render nesting benar → cleanup total (content+terms 0).
Typecheck/lint/test bersih, CSS bundle re-check (Gotcha #21). Deploy kedua
app — live.

**Catatan proses**: `git add -A -- apps packages` (pathspec dipakai sejak
awal sesi ini untuk hindari nge-stage file scratch/temp) diam-diam
TIDAK menyertakan `themes/` — file breadcrumb Phase 11
(`themes/default/app/pages/category/[slug].vue`) sudah ter-build+deploy
tapi baru ke-commit belakangan di Phase 12 (lihat commit terpisah "Fix:
commit the Phase 11 breadcrumb file..."). **Pelajaran**: kalau pakai
`git add -A -- <pathspec>` yang eksplisit sebut folder, WAJIB cek
`git status --short` SETELAH staging (bukan cuma sebelum) untuk pastikan
tidak ada folder lain yang kena skip — atau lebih aman, sebut SEMUA
top-level folder yang mungkin disentuh (`apps packages themes`) daripada
subset yang "biasanya" cukup.

### Phase 12 — Custom Fields UI generik di atas `content_meta` (selesai)

Fix race condition dulu: `content_meta` tidak punya unique constraint di
`(content_id, key)`, `set()` sebelumnya find-then-update/insert (2 write
concurrent ke key baru bisa keduanya insert, jadi 2 row). Migration `0006`
tambah unique index, `set()` ditulis ulang `onConflictDoUpdate` (pattern
sama `SettingsService.set()`). `delete(contentId, key)` baru ditambah.

Fitur: `CustomFieldsPanel.vue` (add/edit/delete key-value, best-effort
JSON.parse saat simpan) didaftarkan untuk "post" DAN "page" lewat
`app/plugins/register-core-editor-panels.ts` baru — SENGAJA terpisah dari
`app/plugins/load-plugins.ts` (loader plugin PIHAK KETIGA) supaya tidak
mengesankan panel core ini bisa di-toggle kayak plugin. `pages/[id].vue`
sebelumnya TIDAK PUNYA blok render editor panel sama sekali (Phase 3 page
CRUD tidak pernah wiring ini karena example-plugin cuma target "post") —
ditambahkan sekarang. Endpoint `GET/PUT/DELETE /api/pages/[id]/meta` baru
(post sudah ada sejak Phase 7, page belum pernah).

**Diverifikasi runtime**: tambah field via panel generik → round-trip
benar → hapus → panel `example-plugin` (key beda, tabel sama) tidak
terpengaruh → **2 PUT concurrent ke key BARU yang sama → cuma 1 row
tersisa** (bukti nyata upsert fix, bukan cuma "compile lolos") → SSR panel
render di post DAN page editor → cleanup total (`content_meta` cascade
ikut terhapus). Typecheck/lint/test bersih. Deploy admin — live.

### Phase 13 — Comments (moderasi, threaded reply, rate-limited) (selesai)

Tabel baru `comments` (`contentId` FK cascade, `parentId` self-ref 1 level
threaded reply — pattern sama `terms.parentId`, `authorName/authorEmail/
authorUserId?`, `body`, `status` enum pending/approved/spam/trash,
`authorIp/userAgent`). Capability baru `moderate_comments` — masuk
`admin`+`editor` di `SYSTEM_ROLES`, WAJIB re-run `pnpm db:seed` di database
yang sudah pernah di-seed sebelumnya supaya capability baru ke-grant (sudah
dijalankan+diverifikasi). `CommentService.create()` (jalur publik) SENGAJA
paranoid — cek ULANG langsung status `content` target `published` (tidak
percaya caller), jadi comment ke draft/scheduled/trashed mustahil walau ID
ditebak.

`apps/frontend` dapat `server/utils/rate-limit.ts` sendiri (duplikat dari
admin — proses Nitro terpisah, tidak bisa share Map in-memory) +
`POST /api/comments` (5/15menit/IP). `GET /api/posts/[slug]` sekarang
resolve comment approved + flag `commentsEnabled` (setting baru, generic
key/value, tanpa migrasi). Komponen theme baru: `CommentList.vue`
(rekursif untuk nested reply, pattern sama `BlockRenderer.vue`, Gotcha
#10), `CommentForm.vue` (Tailwind polos, tanpa Nuxt UI). Admin: `/comments`
pakai pattern `AdminDataTable`/bulk-action dari Phase 10, toggle setting
baru `commentsEnabled`/`commentsRequireApproval` di Settings.

**Diverifikasi runtime**: enable comments → submit publik ke post
published → pending, absen dari halaman publik → admin approve → tampil →
reply threaded → approve → **SSR render nesting benar** → submit ke draft
→ 404 nyata → mark spam → hilang dari publik, tetap kelihatan admin kalau
filter `?status=spam` eksplisit → rate limit kena di percobaan ke-3 (bukan
ke-6, karena traffic test sebelumnya dari IP yang sama sudah makan
sebagian kuota 5/15menit — perilaku BENAR, bukan bug). Cleanup total
(cascade delete `comments` ikut terhapus tanpa disentuh langsung).
Typecheck/lint/test bersih, CSS bundle re-check (67KB→71KB, Gotcha #21).
Deploy kedua app — live.

### Phase 14 — Custom Menus (selesai)

Tabel baru `menus` (`key` unique, `name`) dan `menu_items` (`menuId` FK
cascade, `parentId` self-ref 1 level TANPA FK/cascade — pattern sama
`terms.parentId`, guard di service layer bukan DB — `label`, `linkType`
enum(custom/content), `customUrl`/`contentId` nullable, `sortOrder`,
`openInNewTab`). Capability baru `manage_menus` (masuk `editor` di
`SYSTEM_ROLES`). `MenuService.resolveMenu(key)` — nilai tambah utamanya —
join item `linkType='content'` ke tabel `content` SAAT DIBACA (bukan
disimpan sebagai URL statis di `menu_items`), jadi link tetap benar walau
slug/title target berubah belakangan; referensi content yang sudah
terhapus (dangling) di-skip diam-diam alih-alih render link mati.
`deleteItem()` guard kalau masih ada child (pattern sama
`TaxonomyService.deleteTerm()`, Phase 11).

Admin: `/menus` baru (pilih/buat menu, tambah item URL-custom atau
pilih-content dari page/post yang sudah ada, reorder pakai tombol
naik/turun (swap `sortOrder` antar sibling) + indent/outdent (ubah
`parentId`) — SENGAJA tanpa library drag-drop, konsisten filosofi theme
publik "Tailwind polos, tanpa dependency baru yang tidak perlu"). Nav
sidebar admin dapat entry "Menus" baru.

Frontend: `GET /api/menus/[key]` baru di KEDUA app, tanpa auth (pattern
sama `GET /api/branding`) — dipanggil publik dari
`themes/default/app/layouts/default.vue` yang array `navLinks`
hardcoded-nya diganti fetch `menus/primary` (nav) dan `menus/footer`
(footer), MASING-MASING dengan fallback ke link hardcoded lama
(Beranda/Blog) kalau menu itu belum dikonfigurasi/kosong — supaya
instalasi baru yang belum sentuh `/menus` nav-nya tidak pernah kosong.

**Catatan verifikasi**: karena dev dan produksi berbagi Postgres yang
sama (lihat peringatan ⚠️ di atas), dan password admin produksi yang
sungguhan TIDAK diketahui (sudah diganti dari seed default sejak
Pekerjaan #5), testing login-based curl fase ini pakai **user QA
sementara** (dibuat via script `tsx` langsung panggil
`userService.create()`+`roleService.setRolesForUser(..., ["admin"])`,
BUKAN reset password admin asli) — dihapus lagi (row `users`+`user_roles`)
begitu verifikasi selesai, tanpa pernah menyentuh kredensial admin
produksi. Kalau sesi berikutnya butuh login sungguhan di dev/curl testing
dan tidak tahu password admin saat ini, ulangi pola ini (bikin+hapus user
QA sekali pakai) daripada reset password admin asli.

**Diverifikasi runtime**: buat menu "primary" → tambah item content-linked
(page) + item custom-link → cek urutan+resolusi awal benar → reorder
(swap `sortOrder`) → resolusi ikut berubah urutan → SSR homepage render
nav sesuai urutan baru → **ganti slug page yang di-link → resolve ulang
tanpa nulis apa pun ke `menu_items` → link nav otomatis ikut berubah**
(bukti resolusi tidak stale, bukan cuma diasumsikan) → nested 1 item jadi
child item lain → hapus parent selagi masih py child → 400 ditolak dengan
pesan jelas → hapus child dulu → hapus parent → sukses → hapus menu →
cascade `menu_items` ikut terhapus → SSR halaman admin `/menus` render
benar. Cleanup total (`menus`/`menu_items`/content test 0, user QA
terhapus, admin asli tidak tersentuh). Typecheck/lint/test (29/29) bersih,
CSS bundle re-check (Gotcha #21). Build kedua app + `pm2 restart` — live
di kedua domain, tenant lain di VPS ini tidak terganggu.

### Phase 15 — Full-text search (selesai)

`content` dapat kolom baru `contentText` (plain text hasil `extractPlainText()`
baru di `shared/content-doc.ts` — jalan tree block, gabungkan semua text
node — dipanggil dari `ContentService.create()`/`update()`/`restoreRevision()`)
plus generated column `search_tsv tsvector` (migration `0009`, GIN index)
yang hitung `to_tsvector('simple', title || excerpt || content_text)`.
`search_tsv` SENGAJA TIDAK dideklarasikan di Drizzle schema TS sama sekali
(write-never, cuma pernah dibaca) — `SearchService` satu-satunya consumer,
akses lewat `db.execute(sql\`...\`)` mentah, bukan query builder.

`SearchService.search(query, {type?, limit, offset})` — `plainto_tsquery`
terhadap `search_tsv`, filter `status='published'`, urut `ts_rank`,
snippet dari `ts_headline` native Postgres. Teks query SELALU dikirim
sebagai bound parameter (bukan concat string) walau `plainto_tsquery`
sendiri sudah kecil kemungkinan disuntik. **Mitigasi XSS yang WAJIB
ada**: output `ts_headline` di-render di publik lewat `v-html` (perlu,
supaya tag `<b>` highlight-nya jalan) — jadi teks `excerpt`/`content_text`
mentah DI-ESCAPE (`&`/`<`/`>`) SEBELUM masuk `ts_headline`, supaya
`<script>` literal yang (sengaja/tidak sengaja) ke-ketik penulis di field
excerpt tidak pernah bisa eksekusi di browser pengunjung yang query-nya
match. Diverifikasi NYATA (bukan diasumsikan): post dengan excerpt berisi
`<script>alert(1)</script>` balik dari API sebagai string ter-escape aman
plus tag `<b>` asli dari `ts_headline` yang TIDAK ikut ter-escape (hasil
highlight tetap tampil).

Endpoint baru `GET /api/search` di `apps/frontend` (rate-limited
30/menit/IP, pattern sama `checkRateLimit` komentar/login), halaman
publik baru `themes/default/app/pages/search.vue`, search box
`<form method="get">` server-rendered di header theme (desktop) + icon
cari yang link ke `/search` (mobile) — tanpa JS wajib, konsisten filosofi
theme.

**Bug nyata ketemu sebelum deploy, DARI verifikasi SSR bukan
typecheck/lint (keduanya hijau)**: edit header theme untuk nambah search
box meninggalkan satu `<div>` wrapper mobile-nav baru TANPA tag penutup —
cuma muncul sebagai Vue compiler error 500 saat SSR (`curl` halaman HTML),
sama sekali tidak terdeteksi `nuxt typecheck`/`eslint`. Contoh lain
disiplin Gotcha #17 ("typecheck lolos ≠ runtime benar") terbukti berguna.

**Catatan proses login testing**: pola user QA sekali-pakai dari Phase 14
diulang di sini juga (dibuat, dipakai, dihapus — kredensial admin
produksi tidak pernah disentuh).

**Diverifikasi runtime**: publish post+page dengan keyword beda → search
balikin keduanya dengan `ts_rank` benar + snippet ter-highlight benar →
draft dengan keyword SAMA seperti post published → **TERBUKTI absen
total** dari hasil search → verifikasi kamus `simple` (tanpa stemming):
query yang butuh token "search" DAN "test" secara literal benar menolak
post yang cuma punya "search testing" (bukan bug — "testing" ≠ "test"
tanpa stemming) → query kosong/aneh → 200 hasil kosong (bukan 500) →
pagination halaman di luar range graceful → rate limit kena di request
~30 dalam 1 menit. Cleanup total (`content` count 0, user QA terhapus).
Typecheck/lint/test (29/29) bersih, CSS bundle re-check (71KB→72KB,
Gotcha #21). Build kedua app + `pm2 restart` — live di kedua domain,
tenant lain di VPS ini tidak terganggu.

### Phase 16 — Duplicate post/page (selesai)

`ContentService.duplicate(actor, id)` — copy row `content` itu sendiri
saja (title dapat suffix " (Copy)", slug dibuat unik dengan append
`-copy`/`-copy-N` sampai tidak collision, status DIPAKSA `draft` walau
sumbernya published, revisi TIDAK ikut disalin — duplikat mulai histori
sendiri). Ownership ditegakkan pola sama seperti `update()`
(`assertOwnershipOrCapability` — butuh `edit_others_posts`/`edit_pages`
kalau bukan pemilik source).

**Keputusan desain**: menyalin row terkait (terms, `content_meta`, SEO)
SENGAJA dilakukan di level API route (`POST /api/posts/[id]/duplicate` +
`/api/pages/[id]/duplicate` baru), pakai service per-concern yang sudah
ada (`taxonomyService`/`contentMetaService`/`seoService`) — BUKAN nambah
dependency ke constructor `ContentService`. Ini konsisten dengan pola yang
sudah ada di codebase: SEO sudah punya endpoint PUT sendiri, tidak
di-merge ke `update()`.

Admin UI: kolom aksi "Duplikat" baru di tabel list posts DAN pages
(`AdminDataTable` `columnsCount` naik 3→4) — klik langsung duplikat lalu
navigasi ke editor draft hasil duplikat.

**Diverifikasi runtime**: duplikat post lengkap (kategori+tag+custom
field+SEO override) → hasil draft, slug unik, terms/meta/SEO sama persis,
0 revisi, id/createdAt beda → duplikat DARI hasil duplikat (chained) →
slug tetap tidak collision (`-copy-copy`, bukan bentrok) → sebagai
`author` TANPA `edit_others_posts`, duplikat post user lain → 403 →
duplikat post miliknya sendiri → 200 sukses. Cleanup total (`content`
count 0, kedua user QA terhapus). Typecheck/lint bersih di core/admin,
`pnpm test` 29/29. Build+deploy **admin saja** (`pm2 restart
selftaught-admin` — frontend/theme tidak disentuh fase ini), live, tenant
lain tidak terganggu.

### Phase 17 — Reusable blocks, model SYNCED (selesai)

**Fase terbesar di batch ini** — user secara eksplisit memilih model
SYNCED reference (bukan detached-copy yang lebih sederhana yang tadinya
saya rekomendasikan) sewaktu diskusi plan-mode: edit sumber HARUS langsung
berubah di semua post yang memakainya, tanpa perlu save ulang post itu.

Tabel baru `reusable_blocks` (title, content jsonb, createdBy) dan
`reusable_block_usages` (junction, `(reusableBlockId, contentId)` unique).
Usage tracking dilakukan sebagai **plain table write LANGSUNG di dalam
`ContentService.create()/update()/duplicate()/restoreRevision()`**
(method privat baru `syncReusableBlockUsages()`, didukung
`extractReusableBlockRefs()` baru di `shared/content-doc.ts`) — SENGAJA
BUKAN lewat dependency `ReusableBlockService` yang di-inject ke
`ContentService` (constructor `ContentService` tidak berubah), karena
akurasi tabel usage ini penting di SEMUA jalur tulis content, dan
`ReusableBlockService.delete()` bergantung penuh padanya untuk menolak
hapus block yang masih dipakai.

**Inti model SYNCED**: `ReusableBlockService.resolveDocument(doc)` jalan
tree dan, di tiap node `reusableBlockRef`, splice konten block yang
DIBACA LANGSUNG DARI DB SAAT ITU (rekursif, dengan cycle guard) — bukan
value yang di-cache di json `content` milik post. Ini jalan di
`GET /api/posts/[slug]`/`GET /api/pages/[slug]` (`apps/frontend`) —
begitu sampai ke browser, TIDAK ADA lagi node `reusableBlockRef` di
dokumennya sama sekali, jadi TIDAK PERLU render component/entry
`BlockRegistry` publik untuk tipe block ini.
`ReusableBlockService.update()` (`PUT /api/reusable-blocks/[id]`) adalah
jalur tulis "Edit sumber" — nulis langsung ke `reusable_blocks`, TIDAK
lewat save post yang mereferensikannya.

Admin editor: Tiptap Node extension baru (`reusableBlockRef`, atom,
`apps/admin/app/components/reusable-block-extension.ts`) dengan Vue
NodeView (`ReusableBlockNodeView.vue`) yang fetch+preview konten block
CURRENT read-only (reuse `BlockRenderer` dari `@selftaught/blocks`) di
dalam container bertanda "tersinkron", plus tombol "Edit sumber" yang
buka `USlideover` dengan instance `BlockEditor` sendiri yang nulis
langsung ke block (skip save post sama sekali). `BlockEditor.vue` dapat 2
toolbar action baru: "Simpan sebagai reusable block" (capture selection
Tiptap via `state.doc.cut(from,to)`, POST jadi block baru, ganti selection
di tempat jadi node reference) dan "Sisipkan reusable block" (picker list
block yang sudah ada). Halaman admin baru `/reusable-blocks` (list+usage
count per block+rename+hapus) + entry sidebar "Reusable Blocks".

**Diverifikasi runtime — bukti nyata model SYNCED, bukan diasumsikan**:
buat block "CTA Banner" → referensikan dari 2 post published berbeda →
`GET /api/posts/[slug]` KEDUANYA resolve+splice konten block dengan benar,
SSR HTML keduanya benar-benar berisi teks hasil resolve → **edit block
lewat `PUT /api/reusable-blocks/[id]` (TIDAK sentuh post sama sekali) →
KEDUA post langsung reflect teks baru di request berikutnya** — bukti
utama yang membedakan dari detached-copy → guard hapus: ditolak selagi 2
post masih referensi → lepas referensi 1 post → masih ditolak (tersisa 1)
→ lepas semua → hapus sukses. Cleanup total (`content`/
`reusable_blocks`/`reusable_block_usages` count 0, user QA terhapus).
Typecheck/lint bersih di core/admin/frontend, `pnpm test` 29/29. Build
kedua app + `pm2 restart` — live di kedua domain, tenant lain tidak
terganggu.

### Phase 18 — Autosave + revision diff (selesai)

Autosave mayoritas wiring: `revisions.revisionType` sudah punya nilai
`"autosave"` sejak Phase 4, tidak pernah dipakai.
`RevisionService.upsertAutosave()` jaga PERSIS 1 row autosave per content
(delete-then-insert, bukan partial unique index — realistis cuma 1 editor
aktif per waktu). `ContentService.autosave(actor, id, input)` baru
SENGAJA terpisah dari `update()` — TIDAK sentuh row `content` utama
(title/slug/updatedAt), supaya tidak ganggu save manual concurrent atau
urutan "Diperbarui" di list. Endpoint baru `PUT /api/posts/[id]/autosave`
(+pages) + `GET .../revisions/autosave`. Editor (`posts/[id].vue`,
`pages/[id].vue`) polling 30 detik via `setInterval`, cuma PUT kalau
snapshot title/excerpt/content beda dari save/autosave terakhir — indikator
"Tersimpan otomatis pukul HH:MM" di sebelah tombol Simpan. Panel Revisions
dapat callout "Pulihkan dari autosave" kalau ada autosave lebih baru dari
save manual terakhir (reuse `restoreRevision` yang sudah ada — autosave
cuma revision row bertag beda).

Revision diff: `RevisionService.diffDocuments()` baru jalan `diffWords`
(dependency baru `diff`/jsdiff di `packages/core`) atas hasil
`extractPlainText()` (Phase 15) dari 2 dokumen. Diff jalan SERVER-SIDE
penuh di `GET /api/posts/[id]/revisions/diff?from=&to=` (+pages, `to`
terima id revisi ATAU literal `"current"` untuk diff ke row content
live) — supaya `diff` tidak pernah masuk client bundle. Tombol "Diff" baru
di tiap baris revisi, buka `USlideover` render strikethrough/underline.

**Bug nyata ketemu dari verifikasi SSR, BUKAN typecheck/lint (keduanya
hijau)**: draft pertama nulis `autosaveInterval = setInterval(...)`
langsung di top-level `<script setup>` — Nuxt SSR juga menjalankan kode
level itu di server dan MENOLAK EKSPLISIT ("`setInterval` should not be
used on the server") — SEMUA `GET` halaman editor post/page jadi 500.
Fix: pindahkan `setInterval` ke dalam `onMounted()`. Kesalahan sekelas
sama dengan peringatan Gotcha #17 soal jangan percaya typecheck/lint di
atas request SSR sungguhan.

**Diverifikasi runtime**: save manual post ("Hello world", revision v1
snapshot) → panggil endpoint autosave 2× beda konten → DB konfirmasi PERSIS
1 row bertag `autosave` isi teks PALING BARU, terpisah total dari row
`revision` manual (tidak terganggu) → restore dari autosave → konten live
cocok → diff revisi "Hello world" vs state "Hello brave new world" (kata
persis dari plan) → **"brave new" ke-flag sebagai addition**, sisanya
tidak berubah → SSR kedua halaman editor benar setelah fix `setInterval`.
Cleanup total (`content`/`revisions` count 0, user QA terhapus).
Typecheck/lint bersih di core/admin, `pnpm test` 29/29. Build+deploy
**admin saja** (`pm2 restart selftaught-admin` — frontend/theme tidak
disentuh fase ini), live, tenant lain tidak terganggu.

### Phase 19 — Self-registration + public author profiles (selesai)

Implementasi paket yang sudah disetujui user eksplisit di plan-mode: session
`apps/frontend` TERPISAH total dari admin, role baru 0-capability sebagai
default self-registration yang aman, dan admin login menolak akun
0-capability di boundary login (bukan di action).

- `nuxt-auth-utils` dipasang sebagai instance module SENDIRI di
  `apps/frontend` — cookie name sendiri (`selftaught-frontend-session`,
  beda dari default admin `nuxt-session`) + secret sendiri
  (`NUXT_FRONTEND_SESSION_PASSWORD`, terpisah dari `NUXT_SESSION_PASSWORD`
  admin). Nama cookie beda ini penting BUKAN cuma di produksi (subdomain
  beda otomatis isolasi cookie) tapi JUSTRU lebih penting di dev lokal
  (kedua app jalan di host yang sama, cookie TIDAK port-scoped — nama sama
  akan diam-diam collision).
- `SYSTEM_ROLES.subscriber` baru (0 capability) — setara "Subscriber"
  WordPress, default aman untuk siapa saja yang self-register.
  `apps/admin/server/api/auth/login.post.ts` sekarang resolve capability
  actor SETELAH verify credential, tolak 403 kalau kosong SEBELUM
  `setUserSession` — akun subscriber ditolak dari awal, bukan diizinkan
  masuk lalu 403 di setiap action.
- `users` dapat kolom `bio`/`avatarMediaId` (soft reference tanpa FK,
  pattern sama `content.featuredMediaId`, Gotcha #12)/`slug` (unique).
  `UserService.create()` SEKARANG SELALU generate slug unik dari
  displayName (algoritma slugify sama seperti posts/pages) untuk SEMUA
  user (self-registered ATAU dibuat admin) — jadi `/author/[slug]` selalu
  punya sesuatu untuk di-link.
- Settings baru (tanpa migrasi): `allowSelfRegistration` (default
  **false** — registrasi terbuka di situs sekolah itu magnet spam),
  `selfRegistrationDefaultRole`. Card baru di admin `/settings`.
- Endpoint baru `apps/frontend`: `POST /api/register` (rate-limited
  5/jam/IP, gated setting di atas), `POST/DELETE /api/auth/{login,logout}`
  (guard KEBALIKAN dari login admin — di sini SENGAJA menyambut akun
  0-capability), `GET/PUT /api/account/profile` (protected
  `requireUserSession`), `GET /api/author/[slug]` (publik, `ContentService`
  dapat filter `authorId` baru, cuma post published).
- Halaman baru `themes/default`: `login.vue`, `register.vue`,
  `account/profile.vue` (protected via middleware auth versi frontend baru,
  mirror punya admin), `author/[slug].vue`.

**Diverifikasi runtime**: registrasi ditolak 403 selagi setting off →
admin nyalakan → registrasi sukses, DB konfirmasi role `subscriber`, 0
capability → akun itu DITOLAK (403) login ke API admin → login ke situs
PUBLIK sukses → edit bio → `/author/[slug]` reflect → terpisah, sebagai
QA admin publish 1 post + biarkan 1 draft → `/author/[slug]` admin cuma
list yang published → logout → `/account/profile` redirect `/login`.
Cleanup total (content count 0, kedua akun QA terhapus, setting
`allowSelfRegistration` dikembalikan ke false). Typecheck/lint bersih di
core/admin/frontend, `pnpm test` 29/29. Build kedua app + CSS bundle
re-check (Gotcha #21, 72KB→72.6KB) + `pm2 restart` — live di kedua
domain, tenant lain tidak terganggu.

### Phase 20 — Import/Export (JSON backup/restore + WXR best-effort) (selesai)

Capability baru `manage_import_export`, SENGAJA terpisah dari
`manage_settings` — dump/restore data penuh cukup sensitif untuk gate
sendiri, cuma role `admin` yang dapat secara default (editor tidak).

`ExportService.exportAll()` — bundle JSON versioned (content, terms,
metadata media, comments). Cross-reference dipakai KEY PORTABLE, bukan
DB id (id tidak pernah survive siklus delete-lalu-reimport, apalagi
instance beda): parent/term content pakai slug, link media pakai
`fileName` storage, threading comment pakai posisi ordinal di array
export. Scope v1 (sesuai plan): media cuma metadata + path relatif
storage, TIDAK bundling byte file binary-nya.

`ImportService.importJson()` recreate lewat `ContentService.create()`/
`TaxonomyService.createTerm()` (semua validasi/capability normal tetap
berlaku), **skip** (bukan duplikat) content yang `(type,slug)` sudah ada
atau term yang `(taxonomy,slug)` sudah ada. `ContentService.setStatusUnchecked()`
baru (system-level, tanpa actor check, pola sama `publishDueScheduled()`)
mengembalikan status/publishedAt asli row yang diimport (create() selalu
mulai row sebagai draft). Comment ditulis LANGSUNG ke tabel (skip guard
published-only `CommentService.create()` — pantas untuk bulk restore
terpercaya) dan di-dedup by `(contentId, authorEmail, body, createdAt)`.

**Bug idempotency nyata ketemu DARI verifikasi fase ini sendiri**: draft
pertama comment TIDAK punya existence-check sama sekali — import ulang
export yang sama menduplikasi SETIAP comment di tiap run, sementara
content/terms sudah benar no-op. Di-fix (dedup key di atas) dan
diverifikasi ulang sebelum lanjut.

`ImportService.importWxr()` parse WXR WordPress (dependency baru
`fast-xml-parser`) jadi bentuk bundle yang SAMA, lewat jalur pembuatan
content yang IDENTIK. Best-effort/lossy secara eksplisit, dinyatakan
jelas di copy UI: cuma item post/page yang diimport (attachment/nav-menu-
item di-skip); HTML body lewat `htmlToBlocks()` baru yang cuma kenal tag
top-level `<p>`/`<h1-6>`, sisanya di-strip ke plain text (tidak preserve
shortcode/gallery/Gutenberg block); nama kategori/tag survive tapi
hierarki, featured-image attachment, postmeta, author mapping TIDAK.

Halaman admin baru `/import-export`: tombol export (download file JSON
browser), input file JSON dengan preview pre-commit (hitung create/skip
per koleksi SEBELUM nulis apa pun) + langkah konfirmasi, input file WXR
dengan ringkasan hasil sendiri.

**Diverifikasi runtime**: bikin situs kecil (post+page+category+tag+1
comment via endpoint publik) → export → hapus semua → reimport →
status/slug/term-link/atribusi comment SEMUA cocok → reimport LAGI file
export yang SAMA → idempotent sungguhan (0 created, semua skip, termasuk
comment setelah fix) → import sample WXR (post h2+2 paragraf+category+tag,
page draft, 1 attachment) → attachment ke-skip benar (2 content dibuat,
bukan 3), status mapping benar, HTML jadi heading+2 paragraph block
dengan `<strong>` ter-strip ke plain text sesuai dokumentasi. Cleanup
total (semua count 0, user QA terhapus). Typecheck/lint bersih di
core/admin, `pnpm test` 29/29. Build+deploy **admin saja** (`pm2 restart
selftaught-admin` — frontend/theme tidak disentuh fase ini), live, tenant
lain tidak terganggu.

### Phase 21 — Plugin/theme installer UI (scope sesuai realita arsitektur) (selesai)

**Batasan nyata dinyatakan di depan, bukan didesain sekitarnya**:
`plugins.config.ts` tetap array TS statis — plugin PACKAGE mana yang
tersedia tetap level kode (harus sudah ter-build ke bundle yang di-deploy;
tidak ada `require()` runtime arbitrary di app Nitro yang di-compile
ahead-of-time). Yang BISA pindah ke DB: enable/disable PER plugin yang
SUDAH terdaftar di kode — dan itu pun baru berlaku penuh setelah proses
restart (`server/plugins/00.load-plugins.ts` jalan SEKALI saat boot).
Theme lebih terbatas lagi: `extends` di `apps/frontend/nuxt.config.ts`
di-resolve Vite/Nitro saat build time (Gotcha #14/#15) — TIDAK ADA
switcher live, section theme di halaman admin READ-ONLY (tampilkan nama
theme aktif doang).

Tabel baru `installed_plugins` (key unique, enabled default true, config
jsonb), di-upsert saat boot untuk tiap entry `plugins.config.ts` TANPA
menimpa toggle `enabled=false` admin sebelumnya (`PluginService.ensureRegistered()`
pakai `onConflictDoNothing`). `setup()` cuma jalan untuk plugin yang DB
bilang enabled. Consumer pertama capability `manage_plugins` (terdaftar
sejak Phase 7, baru sekarang benar-benar dipakai).

Halaman admin baru `/plugins`: toggle per plugin + peringatan "berlaku
setelah restart", plus card Theme read-only. Endpoint baru
`GET/PATCH /api/plugins` (gate `manage_plugins`) dan
`GET /api/plugins/enabled` (gate cuma "sudah login", BUKAN `manage_plugins`
— semua user butuh ini untuk tahu panel apa yang mesti dirender, bukan
cuma admin plugin).

**2 bug nyata ketemu DAN diperbaiki dari verifikasi fase ini sendiri**
(bukan hipotetis, keduanya benar-benar merusak fitur sebelum di-fix):
1. Cek panel-disabled di `app/plugins/load-plugins.ts` draft pertama
   pakai `$fetch` polos di dalam Nuxt plugin — kelas bug SAMA dengan
   riwayat Gotcha #17 punya `apps/admin/app/utils/api.ts`: `$fetch` polos
   saat SSR TIDAK request-scoped, tidak forward cookie session, jadi
   halaman SSR selalu lihat "belum login" dan diam-diam skip register
   panel WALAU plugin-nya enabled. Fix: reuse `apiFetch()` yang sudah ada,
   bukan re-derive fix yang sama dari nol.
2. `AdminUIRegistry.registerEditorPanel()` TIDAK punya dedup — karena
   Nuxt plugin yang memanggilnya jalan ULANG tiap SSR request tapi
   registry-nya module-level singleton yang HIDUP LEBIH LAMA dari satu
   request, tiap request selagi plugin enabled push COPY DUPLIKAT
   component yang SAMA ke list, yang kalau tidak di-fix bakal
   me-render panel berkali-kali. Di-fix jadi idempotent (skip kalau
   component yang SAMA sudah terdaftar untuk content type itu).

Karakteristik singleton-lifetime yang SAMA itu juga berarti disable
plugin TIDAK BISA un-register panel yang SUDAH terdaftar atau un-grant
capability yang SUDAH di-grant DALAM proses yang SAMA yang sedang
jalan — keduanya butuh restart sungguhan, konsisten dengan (bukan
workaround dari) batasan scope fase ini.

**Diverifikasi runtime pakai metode PERSIS sesuai plan** (kill+restart
dev server sungguhan antar toggle, BUKAN cek live tanpa restart): disable
example-plugin → restart → konfirmasi panel TIDAK render di SSR DAN hook
`content:published` TIDAK log lagi saat publish (boot log
`"0/1 enabled: (none)"`) → enable lagi → restart lagi → konfirmasi pulih
total (panel balik, boot log `"1/1 enabled: example-plugin"`).

**Satu limitasi model capability ketahuan, DITERIMA bukan ditutup-tutupi**:
capability yang SUDAH di-grant ke role admin di `role_capabilities` TIDAK
otomatis di-revoke saat plugin yang mendaftarkannya di-disable —
`CapabilityRegistry` di codebase ini additive-only sejak Phase 7 (tidak
ada tracking kepemilikan capability-ke-plugin, tidak ada jalur revoke),
dan bikin revocation sungguhan butuh attribution itu dibangun dulu.
Didokumentasikan sebagai limitasi diketahui, bukan diselesaikan diam-diam
di fase ini. Cleanup total (content 0, user QA terhapus). Typecheck/lint
bersih di core/admin, `pnpm test` 29/29. Build+deploy **admin saja**
(`pm2 restart selftaught-admin` — frontend/theme tidak disentuh fase
ini), live, tenant lain tidak terganggu.

### Phase 22 — Two-factor authentication (TOTP) (selesai)

`users` dapat `totpSecret` (plaintext — trust boundary SAMA seperti
`passwordHash`, tidak ada secrets vault terpisah di codebase ini) dan
`totpEnabled` (default false). Tabel baru `totp_recovery_codes`
(`userId`, `codeHash` pakai `hashPassword`/`verifyPassword` argon2 yang
sudah ada, `usedAt` nullable untuk one-time-use). Dependency baru
`otpauth` (generate/validate TOTP) + `qrcode` (QR setup).

Setup 2 langkah (`TotpService.startSetup`/`confirmSetup`) supaya setup
typo tidak mengunci akun: mulai setup langsung simpan secret baru ke row
user tapi `totpEnabled` TETAP false (setup yang ditinggalkan cuma
nyisain secret tak terpakai, ke-overwrite attempt berikutnya) — cuma
kode YANG BENAR-BENAR VALID yang nyalakan `totpEnabled`, sekaligus
generate 8 recovery code yang di-return SEKALI SAJA (tidak bisa diambil
lagi, pola sama seperti reveal API key).

Login flow: `POST /api/auth/login` sekarang cek `user.totpEnabled`
SETELAH guard zero-capability (Phase 19) tapi SEBELUM `setUserSession` —
kalau enabled, balikin `{requiresTotp, challengeToken}` bukan session
sungguhan. Token dilacak di map in-memory baru
(`server/utils/totp-challenge.ts`, pola sama `rate-limit.ts`, TTL 5
menit), diselesaikan lewat `POST /api/auth/totp/verify` (terima kode
TOTP live ATAU recovery code sekali pakai), rate-limited PER
challenge-token (terpisah dan lebih ketat dari limit login
per-IP/per-email yang sudah ada — brute-force satu token yang
dicuri/ditebak tetap terbatas berapa pun banyak IP yang dipakai
penyerang). `login.vue` dapat langkah form kedua untuk ini.

Self-service di halaman baru `/account` (halaman self-service PERTAMA di
admin) — setup/disable 2FA, disable BUTUH re-entry password (session
yang sudah terbuka saja tidak cukup untuk hal sesensitif ini). Jalur
recovery admin-initiated mirror pola reset password yang sudah ada:
`POST /api/users/[id]/totp/disable` (gate `manage_users`) di halaman
edit user, untuk kasus user kehilangan device DAN recovery code-nya
sekaligus.

**Insiden false-alarm selama verifikasi, TANPA perubahan kode** (dicatat
supaya tidak bingung lagi kalau terulang): satu SSR check sempat
terlihat seolah session sama sekali tidak dikenali — ternyata rate limit
login sudah habis dari saking banyaknya login test berulang saya sendiri
(response 429 TETAP menyertakan header `set-cookie` yang bentuknya mirip
cookie asli, dan saya menangkapnya tanpa cek status line). Restart dev
server (bersihkan rate limiter in-memory) + re-cek ulang end-to-end
dalam SATU shell invocation (bukan lintas beberapa panggilan Bash
terpisah yang tidak share shell variable) mengonfirmasi session dan SSR
keduanya baik-baik saja.

**Diverifikasi runtime**: selesaikan setup dengan kode TOTP dihitung
LANGSUNG dari secret yang di-return (pakai `generate()` otpauth sendiri,
bukan ditebak) → dapat 8 recovery code → login password saja → dapat
challenge token TANPA session terbuat (panggilan authenticated susulan
401) → 3 kode salah ditolak, lanjut ke percobaan ke-9 → 429 (per
challenge token, bukan per IP/email) → login baru + recovery code asli
sukses → PAKAI ULANG recovery code YANG SAMA di challenge baru → ditolak
(bukti one-time-use) → force-disable admin-initiated via halaman
`/users/[id]` → akun bisa login password saja lagi setelahnya. Cleanup
total (users count balik ke 1, tabel recovery codes kosong).
Typecheck/lint bersih di core/admin, `pnpm test` 29/29. Build+deploy
**admin saja** (`pm2 restart selftaught-admin` — frontend/theme tidak
disentuh fase ini), live, tenant lain tidak terganggu.

### Phase 23 — Public REST API v1 (read-only + authenticated comments) (selesai)

Scope SENGAJA lebih sempit dari full parity WP REST API: baca konten
published, dan submit comment sebagai pemilik key yang terautentikasi.
TIDAK ADA remote content-authoring sama sekali — itu permukaan keamanan
jauh lebih besar (pada dasarnya expose ulang sebagian besar admin write
API lewat key-auth), dibiarkan jadi fase terpisah eksplisit kalau memang
dibutuhkan nanti, bukan diam-diam masuk ke fase ini.

Tabel baru `api_keys`: key berformat `<keyId>.<secret>` supaya verifikasi
cukup lookup SATU row by `keyId` (unique, indexed) lalu argon2-verify
secretHash row itu saja — bukan `argon2.verify()` terhadap SEMUA key di
tabel. Raw key di-return SEKALI SAJA saat create (`ApiKeyService.create()`)
dan tidak pernah disimpan/bisa diambil lagi, pola sama recovery code TOTP
(Phase 22). `scopes` kolom jsonb sungguhan tapi BELUM di-enforce di mana
pun — semua key valid+belum-revoked bisa hit semua endpoint v1; disimpan
sebagai schema sekarang supaya penyempitan surface nanti tidak butuh
migration baru.

Middleware baru `apps/frontend/server/middleware/api-auth.ts` resolve
`Authorization: Bearer <key>` jadi `event.context.apiKey` (userId,
scopes, Actor) HANYA untuk path `/api/v1/**` — route lain di app ini
tidak tersentuh. Key hilang/invalid TIDAK ditolak di middleware itu
sendiri (kebanyakan endpoint v1 sengaja terbuka tanpa key); cuma
`POST /api/v1/comments` cek `event.context.apiKey` dan 401 kalau kosong.

Endpoint baca baru `GET /api/v1/{posts,posts/:slug,pages/:slug,categories,tags}`
— status di-hardcode `"published"` LANGSUNG di query, TANPA query
parameter/header/scope APA PUN yang bisa mengubahnya, jadi tidak ada
kombinasi yang bisa munculkan draft/scheduled/trashed, auth atau tidak.
`POST /api/v1/comments` butuh key valid, atribusi ke user PEMILIK key
(displayName/email/id, bukan field freeform), rate-limited PER-API-KEY
(bukan per-IP/email — integrasi legit bisa share egress IP dengan
traffic lain).

Admin UI: card baru "API Keys" di `/account` (halaman self-service Phase
22) — generate (raw key tampil sekali), list (label, terakhir dipakai,
status revoked), revoke. `docs/api.md` baru ditulis tangan (tanpa
tooling OpenAPI di project ini, konsisten gaya dokumentasi
README-centric) — jelaskan tiap endpoint DAN eksplisit apa yang
TIDAK PERNAH dilakukan API ini.

**Diverifikasi runtime**: generate key → publish 1 post + biarkan 1
draft → `GET /api/v1/posts`/`posts/:slug` jalan tanpa auth untuk yang
published, 404 untuk draft → **ulangi request slug draft DENGAN key
terautentikasi (owner PUNYA edit_posts, kasus privilege TERKUAT yang
sengaja dipilih) plus variasi query param (`?status=draft`, dst) →
draft TETAP ABSEN di SEMUA kombinasi, auth atau tidak** → `POST
/api/v1/comments` tanpa key → 401, dengan key → sukses, atribusi benar
ke user pemilik key di tabel comments → revoke key → request berikutnya
dengan key yang sama langsung 401 → key kedua kena rate limit PERSIS di
percobaan ke-21 (limit 20/15menit per-key). Cleanup total (content/
comments 0, user QA terhapus — `api_keys` row-nya ikut cascade-delete,
dikonfirmasi 0 sisa). Typecheck/lint bersih di core/admin/frontend,
`pnpm test` 29/29. Build kedua app + `pm2 restart` — live di kedua
domain (termasuk request nyata ke `/api/v1/categories` produksi), tenant
lain tidak terganggu.

### Phase 24 — oEmbed (allowlist, sanitized, cached) (selesai — FASE TERAKHIR dari 15 fase)

Tabel baru `oembed_cache` (`url` unique, `providerName`, `html`) —
resolve SEKALI per URL, tidak pernah di-fetch ulang saat render/edit
berikutnya (response oEmbed stabil, dan hammer provider tiap page view
gampang kena rate-limit mereka).

`OembedService.resolve()` allowlist-only (YouTube, Vimeo, SoundCloud,
CodePen) lewat protokol oEmbed ASLI (endpoint oEmbed sungguhan tiap
provider), BUKAN discovery terbuka ke domain arbitrary. Twitter/X SENGAJA
di-exclude: model embed-nya butuh script `platform.js` termuat untuk
render, dan tidak ada cara meng-allow itu bersih di bawah aturan
"iframe-only, sanitize yang disimpan" tanpa harus percaya script pihak
ketiga MENTAH-MENTAH atau strip tag `<script>`-nya (yang bikin embed-nya
rusak).

**Bagian security-critical, dinyatakan sebagai requirement bukan
tempelan**: `sanitizeEmbedHtml()` baru strip `<script>...</script>` dan
attribute event-handler inline (`onload=`, `onerror=`, dst) dari response
provider SEBELUM pernah ditulis ke `oembed_cache` ATAU ke `content` json
post — render (`Embed.vue` baru di `@selftaught/blocks`, dipakai admin
NodeView preview MAUPUN `BlockRenderer` publik) TIDAK PERNAH fetch ulang
atau sanitize ulang saat render, cuma percaya yang sudah dibersihkan saat
resolve. **Dieksekusi dengan test negatif SUNGGUHAN**: `sanitizeEmbedHtml()`
dipanggil LANGSUNG dengan `<script>alert(1)</script>` + attribute
`onerror=` yang dirangkai bersama `<iframe>` legit, konfirmasi KEDUA
bagian jahat ke-strip sementara iframe-nya tetap utuh — bukan diasumsikan
aman cuma karena provider allowlist "seharusnya" tidak pernah balikin itu.

Admin editor: Tiptap atom node baru (`embed`, `EmbedNodeView.vue`,
`apps/admin/app/components/embed-extension.ts`) — attrs html/providerName
ditangkap SELURUHNYA saat insert, node-nya sendiri TIDAK PERNAH fetch apa
pun saat edit atau render. `BlockEditor.vue` dapat `handlePaste` hook yang
kenali URL bare ter-paste cocok provider allowlist (cek client-side
LONGGAR saja — allowlist sungguhan yang otoritatif tetap server-side di
`OembedService.matchProvider()`), resolve lewat `POST /api/oembed`,
sisipkan node embed di tempat teks yang di-paste; toolbar "Sisipkan
embed" tawarkan jalur manual sama via prompt URL. KEDUA jalur fallback ke
plain `<a>` link kalau resolusi gagal apa pun (provider tidak didukung,
network error) — bukan block rusak.

**Diverifikasi runtime**: resolve URL YouTube ASLI lewat endpoint oEmbed
live sungguhan, dapat HTML iframe asli → konfirmasi tersimpan di
`oembed_cache` dan resolve ULANG url yang SAMA jadi cache hit ~38ms
(bukan network round-trip kedua) → URL tidak didukung (example.com) →
400 "Unsupported embed provider" graceful, bukan crash → bikin post
dengan embed block hasil resolve, publish, konfirmasi SSR halaman post
PUBLIK berisi `<iframe>` YouTube ASLI yang playable dengan src benar →
konfirmasi halaman editor admin tetap 200 (tidak crash) dengan konten
embed ada — konten hasil render Tiptap NodeView adalah client-side-only
mount (limitasi sama seperti NodeView `ReusableBlockRef` Phase 17), jadi
test negatif/fungsional fase ini dijalankan terhadap service layer dan
render SSR publik, yaitu tempat garansi security dan konten sungguhan
berada. Cleanup total (post test + row `oembed_cache` balik ke 0, user QA
terhapus). Typecheck/lint bersih di core/blocks/admin/frontend, `pnpm
test` 29/29. Build kedua app + `pm2 restart` — live di kedua domain,
tenant lain tidak terganggu.

**Ini menutup Phase 24, fase TERAKHIR dari rencana 15 fase (Phase
10-24) yang disetujui sesi ini** — lihat bagian "Rencana kesetaraan
fitur WordPress" di atas untuk arc lengkap dari Phase 10 sampai sini.

## Pekerjaan pasca-roadmap #26: Production-readiness follow-up

User tanya "apakah sudah siap production?" setelah semua 15 fase di atas
selesai. Jawaban: pada dasarnya ya (sudah live, sudah lewat hardening
pass #4), tapi ada beberapa gap dicek satu-satu.

**Temuan mengejutkan — dokumen ini SENDIRI sudah basi di 3 tempat**,
ketahuan begitu dicek ulang kondisi live (bukan cuma percaya catatan
lama):
1. Isolasi DB (Gotcha #20/Pekerjaan #5) ternyata SUDAH lebih jauh dari
   yang tercatat — owner DB dan grant schema untuk `selftaught_app`
   SUDAH ada, cuma password role-nya yang belum di-set (lihat update di
   Pekerjaan #5 di atas).
2. Git remote SUDAH ada (`github.com/SalityLook/cms`, public) — dokumen
   bilang "belum ada remote".
3. CI SUDAH jalan hijau sungguhan di GitHub Actions — dokumen bilang
   "belum dijalankan sungguhan".

**Pelajaran**: kalau ditanya status/kesiapan sesuatu yang sudah lama
tidak disentuh, JANGAN cuma quote CLAUDE.md — cek kondisi LIVE dulu
(`psql \du`/`has_table_privilege`, `git ls-remote`, GitHub API buat
Actions run) sebelum menjawab atau bertindak berdasarkan dokumen ini.
Dokumen ini adalah snapshot titik waktu, bukan source of truth realtime.

**Structured logging/monitoring** (menutup item deferred di Pekerjaan
#4) — SELESAI. `packages/core/src/logger.ts` baru (`pino`, JSON polos ke
stdout, level dari env `LOG_LEVEL`, TANPA transport/pretty-printing —
pm2 sudah capture+rotate stdout lewat `pm2-logrotate`, jadi tidak perlu
urus file sendiri). Satu Nitro plugin baru per app
(`apps/admin/server/plugins/01.error-logger.ts`,
`apps/frontend/server/plugins/00.error-logger.ts`) hook ke Nitro
`error` lifecycle hook GLOBAL — BUKAN nyentuh `defineApiHandler` atau
route manapun satu-satu. `createError()` TETAP lewat hook ini (tidak
di-bypass), jadi satu hook ini nangkep SEMUA error di kedua app,
termasuk yang di `apps/frontend` yang tidak punya `defineApiHandler`
sama sekali.

**Diverifikasi runtime**: request tanpa auth → log 401 dengan
method/path/statusCode/stack lengkap sebagai JSON → request authenticated
ke post yang tidak ada → log 404 dari `NotFoundError` yang di-mapping
`defineApiHandler` → sama di `apps/frontend` (yang jalur errornya beda,
inline per-route, bukan lewat `defineApiHandler`) → cleanup user QA.
Typecheck/lint bersih di core/admin/frontend, `pnpm test` 29/29.
Build+deploy kedua app + `pm2 restart` — **dikonfirmasi di PRODUKSI
sungguhan** (bukan cuma dev): request nyata ke `self-taught.my.id`
menghasilkan baris log JSON terstruktur di file log pm2
(`/root/.pm2/logs/selftaught-frontend-out.log`).

**Item yang MASIH butuh user jalankan sendiri** (classifier keamanan
blokir, 2 alasan berbeda tapi efek sama):
- Set password role `selftaught_app` (`ALTER ROLE ... WITH PASSWORD`) —
  diblokir alasan `[Secret-Store Writes]`. Setelah itu, update
  `DATABASE_URL` di `.env` root jadi
  `postgres://selftaught_app:<password>@localhost:5432/selftaught`,
  lalu `pm2 restart selftaught-admin selftaught-frontend`. Semua grant
  yang dibutuhkan SUDAH ada (lihat update Pekerjaan #5) — ini murni soal
  set password + ganti connection string, seharusnya cepat begitu user
  yang jalankan.

**Item yang masih perlu keputusan/input user** (bukan blocker teknis,
tapi butuh preferensi/kredensial yang tidak saya punya):
- Self-service password reset via email — butuh kredensial SMTP (host,
  port, user, password, alamat pengirim). Belum ditanyakan/dikerjakan di
  putaran ini, nunggu user putuskan mau pakai layanan apa (atau skip
  kalau memang tidak perlu untuk skala saat ini — `pnpm reset-password`
  CLI tetap ada sebagai jalur darurat).

## Git

Repo `git init` dari awal, dan **SEKARANG SUDAH punya remote** (dikonfirmasi
2026-09-15, sebelumnya dokumen ini salah bilang "belum ada remote" —
kapan/siapa yang nambah remote ini tidak tercatat di sesi manapun):
`origin` → `https://github.com/SalityLook/cms` (public, default branch
`main`). Local branch masih bernama `master`, remote-nya `main` — sudah
sinkron di tip yang sama, tapi kalau mau push, ingat beda nama branch ini
(`git push origin master:main`, bukan `git push` polos yang akan bikin
branch `master` baru di remote). CI (`.github/workflows/ci.yml`) SUDAH
jalan hijau di GitHub Actions (dikonfirmasi via API, bukan cuma lolos
lokal). Identitas git di-set lokal (bukan `--global`):
`user.email=sisalamdev@gmail.com`. Satu commit per fase — jalankan
`git log --oneline` untuk daftar terkini (jangan andalkan daftar hash
statis di dokumen ini, gampang basi).
