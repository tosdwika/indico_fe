# indico_fe — Flash-Sale Dashboard (Next.js)

Dashboard untuk [indico_be](../indico_be): lihat stok secara live, pesan (reservasi), dan konfirmasi sebelum waktu habis.

Live: **https://indico.dwika.tech** (frontend) · **https://indico_engine.dwika.tech** (API)

## Cara Pakai

1. **Lihat stok** — panel kiri menampilkan stok tersedia/terreservasi/total, refresh otomatis tiap 3 detik. Ganti `item_id` untuk melihat item lain.
2. **Pesan** — panel kanan: isi `user_id` dan `quantity`, klik **Reserve stok**. Muncul kartu reservasi dengan hitungan mundur **5 menit**.
3. **Konfirmasi** — klik **Confirm Purchase** sebelum waktu habis. Sukses → pesan hijau dengan ID pesanan.
4. **Habis waktu** — tidak konfirmasi dalam 5 menit → reservasi batal, stok kembali otomatis.

Semua kegagalan dari backend (stok kurang, kedaluwarsa, dsb.) tampil sebagai pesan error yang jelas — teksnya persis dari API.

## Menjalankan

Frontend saja (butuh backend jalan dulu):

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run dev   # buka http://localhost:3000
```

Backend + frontend sekaligus (Docker):

```bash
# dari folder yang berisi indico_be dan indico_fe
cd indico_be && docker build -t indico_engine . && docker run -d -p 8085:8085 --name indico_engine indico_engine
cd ../indico_fe && docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 -t indico . && docker run -d -p 3000:3000 --name indico indico
```

> **Penting:** `NEXT_PUBLIC_API_URL` harus alamat backend yang bisa diakses **browser** (mis. `https://indico.dwika.tech` di produksi), bukan alamat internal Docker. Nilai ini dimasukkan ke bundle saat build — mengubahnya berarti build ulang.

## Pengujian

**Backend** — `go test -race -v ./...`: 6/6 PASS, termasuk stress test (reserve bersamaan tidak oversell; confirm paralel hanya sukses sekali).

**API end-to-end** (live di server produksi): 11/11 skenario lulus — happy path + semua negative case:

| Skenario | Hasil |
|---|---|
| Cek stok / reserve / confirm normal | 200/201/200 ✅ |
| Stok berkurang tepat sesuai quantity reserve & confirm | ✅ |
| `quantity=0`, tanpa `item_id` | 400 `INVALID_INPUT` ✅ |
| Item tidak dikenal | 404 `ITEM_NOT_FOUND` ✅ |
| Quantity melebihi stok | 409 `INSUFFICIENT_STOCK` ✅ |
| Confirm ID tidak dikenal | 404 ✅ |
| Confirm dua kali | 409 `ALREADY_CONFIRMED` ✅ |

**Frontend** — diverifikasi di bundle production: panel stok live, form reservasi, countdown 5 menit dari `expires_at` server (bukan counter lokal — tetap akurat walau tab di-pause), tombol confirm, dan semua state error ter-render dengan aksesibilitas (`role="alert"`/`role="status"`).

## Desain

Mengikuti design system Pinterest: merah `#e60023` khusus tombol utama, sudut membulat 16/32px, Inter sebagai pengganti Pin Sans. Detail token di `src/app/globals.css`.
