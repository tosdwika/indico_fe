# indico_fe — Flash-Sale Dashboard (Next.js)

Mini dashboard untuk [indico_be](../indico_be): live inventory tracker, form reservasi, countdown 5 menit, dan konfirmasi pembelian.

Live: **https://indico.dwika.tech** (frontend + `/api` proxy ke backend Go)

## Run

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run dev   # http://localhost:3000
```

Production:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run build && npm start
```

`NEXT_PUBLIC_API_URL` default `http://localhost:8085` — arahkan ke backend Go (lihat [indico_be](../indico_be)).

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 -t indico_fe .
docker run -p 3000:3000 indico_fe
```

## Fitur

- **Live Inventory Tracker** — total/reserved/available stock, polling tiap 3 detik + tombol refresh
- **Reservation Control** — form User ID + Quantity
- **Expiration & Confirmation** — countdown live 5 menit, tombol Confirm Purchase, error state dirender dari response backend (`INSUFFICIENT_STOCK`, `RESERVATION_EXPIRED`, dst.)

## Pengujian

### Backend — `go test -race -v ./...`

6/6 PASS, tanpa race condition:

| Test | Cakupan |
|---|---|
| `TestReserveInsufficient` | reserve qty > available ditolak |
| `TestReserveItemNotFound` | item tidak dikenal ditolak |
| `TestConfirmNotFound` | reservation_id tidak dikenal ditolak |
| `TestReserveConfirmFlow` | siklus reserve → confirm utuh |
| `TestStressNoOversell` | concurrency tinggi tidak oversell |
| `TestStressConcurrentConfirmIdempotency` | 50 confirm paralel → tepat 1 sukses |

### API end-to-end (live, https://indico.dwika.tech/api)

11/11 skenario lulus — happy path + semua negative cases yang diminta assignment:

| Skenario | Hasil |
|---|---|
| `GET /stock?item_id=…` sukses | 200, payload lengkap |
| `GET /stock?item_id=item_nope` | 404 `ITEM_NOT_FOUND` |
| `GET /stock` tanpa param | 400 |
| `POST /reserve` quantity=0 | 400 validasi input |
| `POST /reserve` sukses | 201, `reservation_id` + `expires_at` (+5 menit) |
| Stok setelah reserve | `reserved_stock` bertambah tepat sesuai qty |
| `POST /confirm` id tidak dikenal | 404 |
| `POST /confirm` sukses | 200, `confirmed_at` |
| Double confirm reservation sama | 409 Conflict — idempotensi terjaga |
| `POST /reserve` qty > stok | 409 `INSUFFICIENT_STOCK` |
| `POST /reserve` item tidak ada | 404 |

### Frontend

Verifikasi bundle production (SSR HTML + JS chunks):

- Panel stok: angka available besar, progress bar, legend total/reserved/available ✅
- Form `user_id` + `quantity`, tombol Reserve (disabled saat stok habis) ✅
- Kartu reservasi aktif + countdown live 5 menit + tombol Confirm Purchase ✅
- Error backend (`INSUFFICIENT_STOCK` dst.) dirender sebagai pill merah dengan `role="alert"`; sukses `role="status"` ✅
- Negative state countdown habis: "Reservasi kedaluwarsa — stok dikembalikan" + refetch ✅

### Desain

Diimplementasikan sesuai design system Pinterest (token lengkap di `src/app/globals.css`): red `#e60023` hanya untuk CTA, radius 16px/32px/pill, Inter sebagai substitusi Pin Sans, hierarki dari weight bukan warna.

## Menjalankan

### Backend (indico_be)

```bash
cd indico_be
go run ./cmd/server          # listen :8085
```

Seed item bisa diatur: `SEED_ITEMS="item_4021:100,item_9001:50" go run ./cmd/server` (default `item_4021:100`).

Docker:

```bash
docker build -t indico_be . && docker run -p 8085:8085 indico_be
```

### Frontend (indico_fe)

Dev:

```bash
cd indico_fe
npm install
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run dev   # http://localhost:3000
```

Docker (production build):

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 -t indico_fe .
docker run -p 3000:3000 indico_fe
```

> `NEXT_PUBLIC_API_URL` di-bake saat build — set sesuai alamat backend yang bisa diakses browser, bukan alamat internal Docker network.

### Keduanya sekaligus

```bash
docker build -t indico_be indico_be/ && docker run -d -p 8085:8085 --name indico_be indico_be
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 -t indico_fe indico_fe/ && docker run -d -p 3000:3000 --name indico_fe indico_fe
```

Buka http://localhost:3000.

## Penggunaan

1. **Lihat stok** — panel kiri menampilkan total/terreservasi/tersedia untuk item di kolom `item_id` (default `item_4021`), auto-refresh tiap 3 detik. Ganti `item_id` untuk item lain (harus ada di `SEED_ITEMS`), lalu keluar dari input.
2. **Buat reservasi** — panel kanan: isi `user_id` dan `quantity`, klik **Reserve stok**. Jika sukses, kartu reservasi aktif muncul dengan countdown 5 menit. Stok kurang → pill error merah (`INSUFFICIENT_STOCK`).
3. **Konfirmasi** — klik **Confirm Purchase** sebelum countdown habis. Sukses → pill hijau dengan ID pesanan. Klik dua kali / setelah expired → ditolak backend dengan error yang sesuai.
4. **Biarkan kedaluwarsa** — tidak konfirmasi dalam 5 menit: countdown habis, stok otomatis dikembalikan, pesan "Reservasi kedaluwarsa".

### Contoh via curl

```bash
# cek stok
curl "http://localhost:8085/api/v1/inventory/stock?item_id=item_4021"

# reservasi 2 unit
curl -X POST http://localhost:8085/api/v1/inventory/reserve \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"usr_1","item_id":"item_4021","quantity":2}'

# konfirmasi (ganti res_… dengan reservation_id dari response di atas)
curl -X POST http://localhost:8085/api/v1/inventory/confirm \
  -H 'Content-Type: application/json' \
  -d '{"reservation_id":"res_883291"}'
```
