# Panduan Penggunaan SelfTaught CMS

Panduan ini untuk **pengguna** (admin, editor, penulis) yang memakai
dashboard sehari-hari — bukan untuk developer yang meng-install/deploy
CMS-nya (lihat [`README.md`](../README.md) untuk itu, dan
[`api.md`](./api.md) untuk REST API publik).

Dashboard admin ada di `/` (atau `admin.<domain-anda>` di produksi). Situs
publik (yang dilihat pengunjung) terpisah, di domain apex-nya.

## Daftar isi

1. [Login & navigasi dashboard](#login--navigasi-dashboard)
2. [Peran & izin (role & capability)](#peran--izin-role--capability)
3. [Menulis konten: post & page](#menulis-konten-post--page)
4. [Block editor](#block-editor)
5. [Reusable blocks (blok tersinkron)](#reusable-blocks-blok-tersinkron)
6. [Embed (YouTube, Vimeo, dst)](#embed-youtube-vimeo-dst)
7. [Custom fields](#custom-fields)
8. [Kategori & tag](#kategori--tag)
9. [Media library](#media-library)
10. [Pencarian](#pencarian)
11. [Komentar](#komentar)
12. [Menu navigasi](#menu-navigasi)
13. [SEO](#seo)
14. [Pengaturan situs & branding](#pengaturan-situs--branding)
15. [Mengelola user](#mengelola-user)
16. [Akun saya (profil, 2FA, API key)](#akun-saya-profil-2fa-api-key)
17. [Registrasi publik & profil penulis](#registrasi-publik--profil-penulis)
18. [Import & export](#import--export)
19. [Plugin & theme](#plugin--theme)
20. [Trash & pemulihan](#trash--pemulihan)

---

## Login & navigasi dashboard

Buka `/login`, masuk dengan email+password. Kalau akun Anda punya
two-factor authentication aktif, akan diminta kode TOTP tambahan setelah
password benar (lihat [Akun saya](#akun-saya-profil-2fa-api-key)).

Setelah login, sidebar kiri (drawer di mobile) berisi semua menu yang
ANDA punya izin akses — kalau sebuah menu (mis. "Users") tidak muncul,
berarti role Anda tidak punya capability untuk itu, bukan bug. Dashboard
utama (`/`) menampilkan ringkasan jumlah post/page/media/draft dan
daftar post terbaru.

Akun dengan 0 capability (role `subscriber`, hasil registrasi publik)
**tidak bisa login ke dashboard ini sama sekali** — akun semacam itu
hanya bisa login di situs publik, lihat
[Registrasi publik](#registrasi-publik--profil-penulis).

## Peran & izin (role & capability)

CMS ini punya 5 role bawaan:

| Role | Bisa apa |
|---|---|
| `admin` | Semua capability — kelola user, plugin, import/export, settings, publish apa saja |
| `editor` | Kelola semua konten (termasuk milik orang lain), kategori/tag, menu, komentar — tidak bisa kelola user/plugin/settings sensitif |
| `author` | Tulis & publish post/page **miliknya sendiri** — tidak bisa edit/hapus punya orang lain |
| `contributor` | Tulis post, tapi cuma sampai status "pending review" — butuh `editor`/`admin` untuk publish |
| `subscriber` | 0 capability — hasil registrasi publik, cuma bisa login di situs publik, tidak bisa akses dashboard admin sama sekali |

Lihat capability persis per role di halaman `/roles` (read-only). Bikin
role custom baru (di luar 5 di atas) belum ada UI-nya — lihat `CLAUDE.md`
kalau butuh ini.

Assign role ke user dilakukan admin lewat `/users/[id]` — satu user bisa
punya lebih dari satu role sekaligus (gabungan capability-nya berlaku).

## Menulis konten: post & page

`/posts` dan `/pages` — daftar dengan search, filter status, pagination,
dan bulk action (pilih beberapa baris → trash/hapus sekaligus). Tombol
"Duplikat" di tiap baris membuat salinan draft (slug baru otomatis,
kategori/tag/custom field/SEO ikut disalin, riwayat revisi TIDAK ikut —
duplikat mulai riwayatnya sendiri).

**Beda post vs page**: post punya kategori/tag, page tidak — page punya
`parentId`+`menuOrder` untuk hierarki (organisasi di admin saja, TIDAK
mempengaruhi struktur URL publik — page selalu diakses `/slug-nya`,
satu segmen).

**Status & alur publikasi** (state machine, tombol aksi di halaman edit
menyesuaikan status saat ini):

```
draft --Ajukan Review--> pending --Publish--> published
draft --Publish langsung--> published          (editor/admin, skip review)
draft --Jadwalkan--> scheduled --(otomatis)--> published
apa saja (kecuali trashed) --Pindah ke Trash--> trashed --Pulihkan--> draft
```

`contributor` cuma bisa sampai `pending` — perlu `editor`/`admin` untuk
klik publish. Post/page yang dijadwalkan (`scheduled`) otomatis
ter-publish sendiri begitu waktunya tiba (dicek tiap menit oleh cron di
belakang, tidak perlu buka dashboard untuk "memicunya").

**Autosave & revisi**: editor autosave tiap ~30 detik kalau ada
perubahan (indikator "Tersimpan otomatis pukul HH:MM" di sebelah tombol
Simpan) — ini terpisah dari save manual, tidak mengubah tanggal
"Diperbarui" di daftar. Panel "Revisions" di sidebar editor menyimpan
snapshot lengkap tiap kali Simpan ditekan; klik "Diff" pada baris revisi
untuk lihat perubahan kata per kata dibanding versi sekarang, atau
"Pulihkan versi ini" untuk kembali ke versi itu (state sekarang
di-snapshot dulu, jadi restore sendiri bisa di-undo).

## Block editor

Editor konten (post/page) memakai block editor bergaya Gutenberg. Toolbar
di atas area tulis: **bold/italic/strikethrough/code**, **H2/H3**, list
(bullet/numbered), quote, code block, garis horizontal, undo/redo, dan
sisip gambar (via URL).

Kalau butuh custom field (metadata tambahan di luar field bawaan seperti
title/excerpt), gunakan panel "Custom Fields" di sidebar — lihat
[Custom fields](#custom-fields) di bawah.

## Reusable blocks (blok tersinkron)

Untuk konten yang dipakai berulang di banyak post/page (mis. banner
promosi, call-to-action) dan **harus ikut berubah di semua tempat** begitu
diedit sekali — bukan copy-paste manual:

1. Blok teks/gambar yang sudah ditulis di editor, seleksi lalu klik
   **"Simpan sebagai reusable block"** di toolbar → beri nama → blok
   itu langsung berubah jadi referensi tersinkron di post ini.
2. Di post/page lain, klik **"Sisipkan reusable block"** → pilih dari
   daftar yang sudah ada.
3. Kelola semua reusable block (rename, lihat berapa post yang memakainya,
   hapus) di halaman `/reusable-blocks`.

**Penting**: mengedit isi reusable block (tombol "Edit sumber" di dalam
kontainer blok itu di editor, atau lewat `/reusable-blocks`) langsung
mengubah tampilannya di **SEMUA** post/page yang memakainya — tidak perlu
"Simpan" ulang tiap post satu-satu. Menghapus reusable block yang masih
dipakai akan ditolak dengan pesan jelas ("masih dipakai di N post") —
lepas dulu referensinya dari tiap post sebelum bisa dihapus.

## Embed (YouTube, Vimeo, dst)

Paste URL YouTube/Vimeo/SoundCloud/CodePen langsung ke dalam editor —
otomatis dideteksi dan diubah jadi embed player (bukan link biasa). Bisa
juga manual lewat tombol "Sisipkan embed" di toolbar (masukkan URL lewat
prompt). Provider di luar 4 itu (termasuk Twitter/X) tidak didukung —
akan tetap jadi link biasa, bukan error.

## Custom fields

Panel "Custom Fields" di sidebar editor post/page — tambah pasangan
key-value bebas (mis. `subtitle`, `sponsor_name`), untuk data yang tidak
punya field bawaan. Value yang berupa angka/boolean/JSON valid otomatis
di-parse; kalau bukan, disimpan sebagai teks polos.

## Kategori & tag

`/categories` dan `/tags` — keduanya CRUD sederhana (nama, slug, deskripsi),
tapi **kategori mendukung hierarki** (parent/child, tampil sebagai tree
berindentasi di admin dan breadcrumb "Induk > Anak" di halaman kategori
publik) sementara **tag tetap flat** (tidak ada parent/child) — ini sama
seperti WordPress. Kategori yang masih punya anak tidak bisa dihapus
sampai anaknya dihapus/dipindah dulu.

## Media library

`/media` — upload gambar (JPEG/PNG/GIF/WebP/SVG) atau PDF, maksimum 10MB
per file. Dimensi gambar (width/height) diekstrak otomatis saat upload.
Featured image di editor post/page, logo/favicon situs di Settings, dan
avatar di profil user semuanya pakai picker dari library yang sama.

## Pencarian

Kotak cari di header situs publik (link ke `/search?q=...`) mencari
lintas post+page yang published, dengan highlight kata yang cocok di
snippet hasil. Pencarian pakai pencocokan kata literal (bukan fuzzy/typo
-tolerant) — mis. mencari "test" tidak otomatis cocok dengan "testing".

## Komentar

Nyalakan/matikan komentar dan atur "butuh approval sebelum tampil" lewat
`/settings`. Kalau aktif, pengunjung situs publik bisa submit komentar
(dan balasan bersarang 1 level) di halaman post. `/comments` di admin —
list dengan bulk action (approve/tandai spam/pindah trash/hapus).
Komentar baru default `pending` (kalau approval diwajibkan) — tidak
tampil di publik sampai di-approve.

## Menu navigasi

`/menus` — bikin/pilih menu (mis. "primary" untuk nav utama, "footer"
untuk footer), tambah item link (custom URL bebas, atau pilih dari
post/page yang sudah ada — link ke content selalu ikut update otomatis
kalau slug/judul content itu berubah, tidak pernah jadi link mati kecuali
content-nya sendiri dihapus). Urutan diatur pakai tombol naik/turun;
indent/outdent untuk bikin sub-menu 1 level. Kalau menu "primary"/"footer"
belum pernah diisi, situs publik tetap tampilkan nav default (Beranda/
Blog) — bukan kosong.

## SEO

Tiap post/page punya panel "SEO" di sidebar editor: override title,
description, canonical URL, gambar OG, dan toggle "noindex" (sembunyikan
dari mesin pencari + `sitemap.xml`). Kalau tidak diisi, otomatis fallback
ke title/excerpt konten, lalu ke default situs. Default situs (title/
description/OG image bawaan, dan toggle "cegah semua indexing" untuk
seluruh situs) diatur di `/settings`.

## Pengaturan situs & branding

`/settings` — nama & deskripsi situs, identitas visual (logo & favicon
kustom — ganti dari default bawaan "SelfTaught", cocok kalau CMS ini
dipakai institusi lain dengan brand sendiri), toggle komentar & registrasi
publik, default SEO situs.

## Mengelola user

`/users` — list, buat user baru (dengan pilih role langsung), edit
displayName/status/role di `/users/[id]`. Dari halaman edit user yang
sama, admin bisa **reset password user lain** (kalau user itu lupa tapi
masih ada admin lain yang bisa login) dan **force-disable 2FA** milik
user itu (kalau device+recovery code-nya hilang bersamaan). Suspend user
(ubah status jadi tidak aktif) langsung mencegahnya login lagi.

Kalau **tidak ada satu pun** admin yang bisa login (lupa semua password),
reset lewat CLI di server — lihat bagian "Reset password admin" di
[`README.md`](../README.md).

## Akun saya (profil, 2FA, API key)

`/account` — halaman self-service (beda dari `/users/[id]` yang untuk
mengelola user LAIN):

- **Two-factor authentication (2FA)**: scan QR code dengan app authenticator
  (Google Authenticator, Authy, dst), masukkan kode 6-digit untuk
  konfirmasi aktivasi. Setelah aktif, Anda akan diberi **8 recovery code
  satu kali pakai** — simpan di tempat aman, ini ditampilkan **cuma
  sekali**. Login berikutnya akan minta kode TOTP (atau recovery code
  kalau device hilang) setelah password benar. Mematikan 2FA butuh
  masukkan password lagi (sesi yang sudah login saja tidak cukup).
- **API Keys**: generate key untuk akses REST API publik (lihat
  [`api.md`](./api.md)) — dipakai kalau ada sistem lain yang perlu baca
  konten atau submit komentar terprogram. Key ditampilkan penuh **cuma
  sekali** saat dibuat; kalau hilang, revoke lalu buat baru (tidak bisa
  diambil lagi setelah dialog ditutup).

## Registrasi publik & profil penulis

Kalau setting "Izinkan registrasi publik" dinyalakan di `/settings`,
pengunjung bisa daftar akun sendiri di situs publik (`/register`) — akun
hasil registrasi mandiri otomatis dapat role `subscriber` (0 capability,
tidak bisa akses dashboard admin). Mereka bisa login ke situs publik
(`/login`, terpisah dari login admin), edit bio di `/account/profile`,
dan siapa pun bisa lihat halaman profil publiknya di `/author/[slug]`
(cuma menampilkan post published miliknya).

Default setting ini **mati** — dianjurkan tetap mati kecuali memang butuh
komunitas publik yang mendaftar sendiri, karena registrasi terbuka rawan
jadi target spam.

## Import & export

`/import-export` (butuh capability `manage_import_export`, default admin
saja):

- **Export**: unduh semua konten (post, page, kategori, tag, metadata
  media, komentar) sebagai satu file JSON.
- **Import JSON**: upload file export di atas (dari instalasi ini atau
  instalasi SelfTaught CMS lain) — ada langkah preview ("akan membuat N
  post, skip M yang slug-nya sudah ada") sebelum benar-benar menulis apa
  pun. Aman dijalankan berulang kali dengan file yang sama (idempotent —
  tidak akan menduplikasi).
- **Import WXR**: upload file export WordPress (`.xml`). Konversi
  **best-effort**, bukan lossless — cuma post/page yang diimport
  (attachment/nav-menu di WXR di-skip), HTML body dikonversi kasar
  (paragraf & heading saja, formatting kompleks/shortcode/gallery
  WordPress hilang), dan hierarki kategori/featured-image
  attachment/postmeta/author asli TIDAK ikut terbawa. Cocok untuk migrasi
  awal, bukan sinkronisasi rutin.

## Plugin & theme

`/plugins` — toggle enable/disable plugin yang **sudah terpasang di
kode** (bukan install plugin baru dari UI — itu butuh developer nambah
package baru ke repo, lihat "Mengembangkan plugin" di README). Perubahan
toggle baru berlaku setelah aplikasi di-restart oleh operator server —
bukan langsung real-time. Section "Theme" di halaman yang sama cuma
menampilkan nama theme aktif (read-only, bukan switcher — ganti theme
juga butuh developer, lihat "Mengembangkan theme" di README).

## Trash & pemulihan

`/trash` — post/page yang di-trash (dari status apa pun kecuali
`trashed` sendiri) muncul di sini, bisa "Pulihkan" (balik ke `draft`)
atau "Hapus Permanen" (tidak bisa di-undo — konten, revisi, dan
metadata-nya hilang total dari database).
