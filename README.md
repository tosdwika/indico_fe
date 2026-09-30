# indico_fe — Flash-Sale Dashboard (Next.js)

Tampilan dari [indico_be](../indico_be): pantau stok langsung, pesan barang, dan selesaikan pesanan sebelum waktunya habis.

Live: **https://indico.dwika.tech** (halaman ini) · **https://indico_engine.dwika.tech** (API-nya)

## Apa yang Bisa Dilakukan

Bayangkan seperti mengikuti flash-sale:

1. **Pantau stok** — di panel kiri terlihat berapa yang masih tersedia, sudah dipesan orang, dan totalnya. Angkanya berubah sendiri setiap 3 detik. Mau lihat barang lain? Ganti saja `item_id`-nya.
2. **Pesan** — di panel kanan, isi user ID dan jumlah unit, lalu klik **Reserve stok**. Muncul kartu pesanan dengan hitungan waktu **5 menit**.
3. **Selesaikan** — klik **Confirm Purchase** selama waktunya masih jalan. Selesai — pesanan tercatat.
4. **Telat** — kalau 5 menit lewat tanpa konfirmasi, pesanan batal sendiri dan stoknya kembali. Coba lagi saja dari awal.

Kalau ada yang gagal — stok kurang, pesanan kedaluwarsa, dan sebagainya — alasannya tampil jelas di layar, langsung dari server.

## Menjalankan

Kalau backendnya sudah jalan, tampilannya bisa langsung dinyalakan:

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8085 npm run dev   # buka http://localhost:3000
```

Atau keduanya sekaligus dengan Docker (dari folder yang berisi dua repo ini):

```bash
cd indico_be && docker build -t indico_engine . && docker run -d -p 8085:8085 --name indico_engine indico_engine
cd ../indico_fe && docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8085 -t indico . && docker run -d -p 3000:3000 --name indico indico
```

> Satu hal yang sering bikin bingung: `NEXT_PUBLIC_API_URL` harus alamat backend yang bisa dijangkau *browser* pengunjung — misalnya `https://indico.dwika.tech` saat produksi — bukan alamat di dalam jaringan Docker. Nilainya juga tertanam saat build, jadi begitu diganti, imagenya perlu dibuat ulang.

## Sudah Dites

Tiga lapis, semua lolos:

**Tes unit & stress (backend)** — `go test -race -v ./...`: pesanan serentak ratusan kali tidak pernah melebihi stok, konfirmasi serentak hanya berhasil sekali.

**API dari luar (produksi)** — 11 skenario dicoba langsung ke server: alur normal pesan-selesaikan, stok yang berkurang tepat jumlahnya, dan semua penolakan yang wajar (stok kurang, barang tak dikenal, pesanan telat, konfirmasi dua kali, input tidak lengkap).

**Tampilan (frontend)** — dicek di hasil build produksi: panel stok yang hidup, formulir pesanan, hitungan mundur yang dihitung dari waktu server (jadi tetap benar walau tab-nya sempat tidak aktif), serta pesan sukses/gagal yang juga ramah untuk pembaca layar.

## Tampilan Visual

Mengikuti gaya desain Pinterest: merah khasnya hanya untuk tombol utama, sudut-sudut membulat, huruf Inter. Semua aturan warnanya ada di `src/app/globals.css`.
