# Indico Frontend

Dashboard web untuk memantau stok dan menjalankan proses reservasi hingga konfirmasi pembelian. Aplikasi ini menggunakan Next.js dan terhubung ke [Indico Backend](../indico_be).

- **Frontend production:** https://indico.dwika.tech
- **API production:** https://indico_engine.dwika.tech

## Fitur Utama

- Menampilkan total stok, stok yang sedang direservasi, dan stok yang masih tersedia.
- Memperbarui data stok otomatis setiap 3 detik.
- Membuat reservasi berdasarkan user ID, item ID, dan jumlah barang.
- Menampilkan detail reservasi aktif beserta hitung mundur 5 menit.
- Mengonfirmasi pembelian sebelum reservasi kedaluwarsa.
- Menampilkan pesan sukses dan error dari backend.
- Mendukung tampilan desktop dan perangkat mobile.
- Menyediakan halaman `/reset` untuk mengatur ulang stok item dan membatalkan reservasi aktifnya.

## Cara Menggunakan Dashboard

1. Buka https://indico.dwika.tech.
2. Periksa stok pada panel **Stok tersedia**.
3. Gunakan `item_4021` sebagai item awal, atau masukkan item ID lain yang tersedia di backend.
4. Isi `user_id` dan `quantity` pada panel **Buat reservasi**.
5. Klik **Reserve stok**.
6. Setelah reservasi berhasil, periksa detail reservasi dan waktu yang tersisa.
7. Klik **Confirm Purchase** sebelum hitung mundur mencapai nol.

Jika reservasi tidak dikonfirmasi dalam 5 menit, reservasi akan kedaluwarsa dan stok dikembalikan secara otomatis.

### Mereset stok

1. Buka https://indico.dwika.tech/reset.
2. Masukkan item ID, jumlah stok baru, dan token reset.
3. Klik **Reset stok**.

Reset akan membatalkan semua reservasi aktif pada item tersebut. Token harus sama dengan `RESET_TOKEN` yang diatur pada backend. Gunakan halaman ini hanya saat memang ingin mengembalikan kondisi stok.

## Persyaratan

- Node.js 24 atau lebih baru
- npm
- Indico Backend yang sudah berjalan (backend menyimpan stok dan reservasi di SQLite)
- Docker (opsional)

## Menjalankan Secara Lokal

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run dev
```

Buka http://localhost:3000.

`NEXT_PUBLIC_API_URL` adalah alamat dasar backend. Kode frontend akan menambahkan path `/api/v1/...`, sehingga nilainya tidak boleh diakhiri dengan `/api`.

Contoh yang benar:

```text
http://localhost:8085
https://indico.dwika.tech
```

Contoh yang salah:

```text
https://indico.dwika.tech/api
```

## Production Build

```bash
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run build
npm start
```

Nilai `NEXT_PUBLIC_API_URL` dimasukkan ke bundle saat proses build. Jika alamat backend berubah, aplikasi harus dibangun ulang.

## Menjalankan dengan Docker

Pastikan backend sudah berjalan di `http://localhost:8085`, kemudian jalankan:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 \
  -t indico .

docker run --rm -p 3000:3000 --name indico indico
```

Buka http://localhost:3000.

## Menjalankan Backend dan Frontend

Jalankan perintah berikut dari direktori yang berisi folder `indico_be` dan `indico_fe`:

```bash
cd indico_be
docker build -t indico_engine .
docker volume create indico_data
docker run -d -p 8085:8085 \
  -e DATABASE_PATH=/app/data/indico.db \
  -v indico_data:/app/data \
  --name indico_engine indico_engine

cd ../indico_fe
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 \
  -t indico .
docker run -d -p 3000:3000 --name indico indico
```

Backend menyimpan stok dan reservasi di SQLite. Data tetap tersedia setelah backend atau container dimulai ulang selama direktori database dipasang sebagai volume Docker.

## Alur Data

1. Frontend mengambil data stok dari endpoint `GET /api/v1/inventory/stock`.
2. Setelah reservasi dibuat, backend mengirimkan `reservation_id` dan `expires_at`.
3. Frontend menghitung waktu yang tersisa berdasarkan `expires_at` dari server.
4. Konfirmasi dikirim ke endpoint `POST /api/v1/inventory/confirm`.
5. Setelah reservasi dikonfirmasi atau kedaluwarsa, frontend mengambil ulang data stok terbaru.

## Penanganan Error

Frontend menampilkan pesan dari backend agar pengguna mengetahui penyebab kegagalan, misalnya:

- stok tidak mencukupi;
- item tidak ditemukan;
- reservasi sudah kedaluwarsa;
- reservasi sudah dikonfirmasi; atau
- input belum lengkap.

Pesan sukses menggunakan `role="status"`, sedangkan pesan error menggunakan `role="alert"` agar dapat dikenali oleh pembaca layar.

## Pengujian

Backend diuji menggunakan:

```bash
go test -race -v ./...
```

Pengujian API mencakup alur normal dan kondisi gagal: input tidak valid, item tidak ditemukan, stok tidak cukup, reservasi tidak ditemukan, reservasi kedaluwarsa, dan konfirmasi ganda.

Frontend production telah diperiksa untuk memastikan:

- data stok dapat dimuat dan diperbarui;
- form reservasi dapat digunakan;
- hitung mundur mengikuti waktu kedaluwarsa dari backend;
- konfirmasi pembelian berjalan; dan
- pesan sukses maupun error tampil dengan benar.

## Desain

Antarmuka menggunakan palet warna, tipografi, radius, dan hierarki visual yang mengacu pada design system Pinterest. Seluruh token tampilan berada di `src/app/globals.css`.
