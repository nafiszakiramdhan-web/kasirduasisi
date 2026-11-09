# Software Design Specification: Sistem Kasir Dua Sisi (PWA Mobile)

Dokumen ini adalah spesifikasi arsitektur teknis dan acuan implementasi untuk agen Google Antigravity dalam membangun Progressive Web App (PWA) Sistem Kasir Coffee Shop Dua Sisi.

---

## 1. Arsitektur Data & Basis Data

Sistem mengacu secara ketat pada **Class Diagram Kelompok 6** yang terdiri dari 3 entitas utama:

```
[ menu ] ──(1 : N)──> [ pesanan ] ──(1 : 0..1)──> [ transaksi ]
```

### 1.1 Skema Relasional SQL
- **`menu`**
  - Atribut: `id_menu` (INT, PK), `nama_menu` (VARCHAR 100), `kategori` (VARCHAR 50), `harga` (DECIMAL 12,2)
  - Operasi Class: `tambah_menu()`, `ubah_menu()`, `hapus_menu()`, `tampil_menu()`
- **`pesanan`**
  - Atribut: `id_pesanan` (INT, PK), `nama_customer` (VARCHAR 100), `id_menu` (INT, FK), `jumlah` (INT), `total_harga` (DECIMAL 12,2)
  - Operasi Class: `buat_pesanan()`, `hitung_total()`, `ubah_pesanan()`, `hapus_pesanan()`
- **`transaksi`**
  - Atribut: `id_transaksi` (INT, PK), `id_pesanan` (INT, FK), `tanggal_transaksi` (DATETIME), `nominal_bayar` (DECIMAL 12,2), `kembalian` (DECIMAL 12,2), `metode_pembayaran` (VARCHAR 50)
  - Operasi Class: `proses_pembayaran()`, `hitung_kembalian()`

### 1.2 Penyimpanan Lokal HP (Dexie.js / IndexedDB)
Untuk mendukung kapabilitas kasir offline di browser HP, Dexie.js memetakan tabel lokal sebagai penampung sementara:
- `db.menu`: Salinan data katalog menu.
- `db.pesanan`: Data pesanan lokal sebelum di-sync ke server.
- `db.transaksi`: Data transaksi lokal dengan tambahan flag `sync_status` (`'pending'` atau `'synced'`).

---

## 2. Design System & Karakteristik Tampilan

- **Orientasi & Viewport:** Layar sentuh HP portrait (Mobile standard $412 \times 915\text{ px}$), mode PWA Standalone.
- **Tema Visual:** POS Dark Mode Native (Kontras tinggi, minim lelah mata).
- **Palet Warna:**
  - Background Dasar: `#121212` (Zinc-950)
  - Container / Card: `#1E1E1E` (Zinc-900)
  - Brand Primary / Aksen: `#F59E0B` (Amber Gold)
  - Aksen Sukses / Lunas: `#10B981` (Emerald Green)
  - Aksen Perhatian / Peringatan: `#EF4444` (Crimson Red)
  - Teks Utama: `#FFFFFF`
  - Teks Sekunder: `#9CA3AF`
- **Aturan Sentuh Layar HP:**
  - `touch-action: manipulation`: Mencegah double-tap zoom saat kasir menekan tombol dengan cepat.
  - `overscroll-behavior-y: contain`: Mencegah gesture tarik ke bawah me-refresh halaman web.
  - Komponen input minimal `16px` font size agar browser mobile tidak melakukan auto-zoom.

---

## 3. Alur Pengguna & Spesifikasi Antarmuka

Antarmuka terdiri dari 4 tab navigasi tetap di bagian bawah layar:

### Tab 1: Katalog / Kasir
- **Status Bar Atas:** Menampilkan nama gerai "Dua Sisi", total transaksi hari ini, dan shift aktif.
- **Pencarian Menu & Filter Kategori:** Search bar instan untuk nama menu dan chip kategori horizontal (*Semua*, *Signature Dua Sisi*, *Coffee*, dll.).
- **Grid Menu Produk:**
  - Kartu produk menampilkan nama menu, kategori, harga, dan tombol tap cepat (+) berwarna oranye.
  - Sekali ketuk pada tombol (+) langsung menambahkan kuantitas menu ke pesanan aktif.
- **Floating Order Pill:** Bilah mengambang di atas navigasi bawah yang menampilkan jumlah item dan tombol cepat "Lihat Pesanan".

### Tab 2: Pesanan / Keranjang
- **Input Nama Customer:** Form input nama pelanggan (wajib diisi sebelum pembayaran sesuai UML).
- **Daftar Item:** Kartu menu terpilih, kuantitas dengan tombol stepper (`-` / `+`), dan tombol hapus item.
- **Ringkasan Perhitungan:**
  - Formula perhitungan total harga:
    $$\text{total\_harga} = \sum (\text{harga} \times \text{jumlah})$$
- **Tombol Aksi:** "Lanjut ke Pembayaran" untuk membuka Bottom Sheet Pembayaran.

### Modal / Bottom Sheet Pembayaran
- Menampilkan nominal tagihan $\text{total\_harga}$ secara jelas.
- Pilihan `metode_pembayaran`: **Tunai / Cash** atau **QRIS**.
- Input `nominal_bayar` dengan fitur tap nominal cepat (Uang Pas, Rp 50.000, Rp 100.000).
- **Validasi Logika Activity Diagram:**
  - Kondisi valid: $\text{nominal\_bayar} \ge \text{total\_harga}$.
  - Jika $\text{nominal\_bayar} < \text{total\_harga}$, tombol proses pembayaran terkunci dan muncul status peringatan.
  - Jika valid, kembalian dihitung secara otomatis:
    $$\text{kembalian} = \text{nominal\_bayar} - \text{total\_harga}$$
- **Aksi Selesai:**
  - Menyimpan data transaksi ke tabel lokal `pesanan` dan `transaksi`.
  - Mengosongkan keranjang dan menampilkan struk ringkasan sukses di layar.

### Tab 3: Riwayat Transaksi
- Menampilkan rekap total omzet dan jumlah transaksi yang telah selesai.
- Daftar riwayat transaksi terurut dari waktu terbaru (`tanggal_transaksi`).
- Menampilkan nama customer, menu yang dibeli, nominal bayar, kembalian, dan metode pembayaran.

### Tab 4: Kelola Menu (Admin Mode)
- Menampilkan seluruh isi tabel `menu`.
- Tombol (+) Tambah Menu yang membuka modal form: input `nama_menu`, pilihan `kategori`, dan input `harga`.
- Opsi ubah (*edit*) dan hapus (*delete*) menu.

---

## 4. Mekanisme Offline & Sinkronisasi Data

1. **Operasional Offline:**
   - Semua operasi kasir (buka menu, catat pesanan, proses bayar) dieksekusi ke Dexie.js (IndexedDB).
   - Transaksi yang tersimpan diberi penanda `sync_status = 'pending'`.
2. **Sinkronisasi Jaringan:**
   - Aplikasi mendengarkan status koneksi via `window.addEventListener('online', syncTransactions)`.
   - Begitu internet tersambung, sistem mengirimkan data `pesanan` dan `transaksi` yang tertunda ke backend API untuk dieksekusi ke tabel SQL pusat.
   - Setelah sukses, status lokal diperbarui menjadi `synced`.