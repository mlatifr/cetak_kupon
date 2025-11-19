# Dokumentasi Test Backend API

## 📋 Deskripsi

Script test otomatis untuk memverifikasi semua API dan validasi data sesuai dengan kunci jawaban soal test interview.

## 🚀 Quick Start

### 1. Pastikan Server Backend Berjalan
```bash
npm start
```
Server harus berjalan di `http://localhost:3000`

### 2. Jalankan Test
```bash
npm test
```

Atau:
```bash
node scripts/testBackend.js
```

## 📋 Prasyarat

1. **Server Backend harus berjalan**
   - Server harus berjalan di `http://localhost:3000`
   - Pastikan port 3000 tidak digunakan aplikasi lain

2. **Database MySQL harus tersedia**
   - Database: `kupon_berhadiah`
   - Pastikan koneksi database di `config.js` sudah benar
   - Pastikan semua tabel sudah dibuat

3. **Data dummy sudah di-insert** (opsional)
   - Bisa menggunakan `dummy_data.sql` atau `scripts/insertDummyData.js`
   - Minimal harus ada: users, prize_config, batches
   - Test akan otomatis generate kupon jika belum ada

## 📊 Test Coverage

Script test mencakup 7 test suite:

### 1. Validasi Struktur Database
- ✅ Koneksi database
- ✅ Tabel `prize_config` memiliki 5 konfigurasi aktif
- ✅ Tabel `batches` memiliki 2 batch (Amir & Nando)

### 2. Test API Endpoints
- ✅ GET `/api/prize-config` - List konfigurasi hadiah
- ✅ GET `/api/batches` - List semua batch
- ✅ GET `/api/batches/1` - Get batch by batch_number
- ✅ GET `/api/coupons` - List semua kupon

### 3. Test Generate Kupon
- ✅ POST `/api/coupons/generate` - Generate kupon untuk batch 1 (5000 kupon)
- ✅ POST `/api/coupons/generate` - Generate kupon untuk batch 2 (5000 kupon)

### 4. Validasi Data Kupon
- ✅ Total kupon = 10.000 (00001-10000)
- ✅ Total hadiah = Rp 25.000.000
- ✅ Distribusi hadiah sesuai (50x100k, 100x50k, 250x20k, 500x10k, 1000x5k)
- ✅ Total kupon berhadiah = 1.900
- ✅ Total kupon tidak beruntung = 8.100
- ✅ Setiap box memiliki 1.000 kupon
- ✅ Komposisi hadiah per box sama (5x100k, 10x50k, 25x20k, 50x10k, 100x5k)
- ✅ Tidak ada hadiah sama pada nomor kupon berurutan
- ✅ Batch 1 memiliki 5.000 kupon (box 1-5)
- ✅ Batch 2 memiliki 5.000 kupon (box 6-10)

### 5. Test QC Validation
- ✅ POST `/api/qc-validations/batch/1/validate` - Run QC untuk batch 1
- ✅ POST `/api/qc-validations/batch/2/validate` - Run QC untuk batch 2
- ✅ GET `/api/qc-validations/batch/1` - Get QC results untuk batch 1
- ✅ Validasi semua test QC harus PASS (DISTRIBUTION_CHECK, BOX_COMPOSITION, CONSECUTIVE_CHECK)

### 6. Test Production Report
- ✅ GET `/api/batches/1/report` - Get production report untuk batch 1
- ✅ GET `/api/batches/2/report` - Get production report untuk batch 2
- ✅ Validasi format report sesuai contoh di soal

### 7. Test Production Logs
- ✅ GET `/api/production-logs` - List semua production logs
- ✅ GET `/api/production-logs/batch/1` - Get production logs untuk batch 1

## 📝 Output Test

Test akan menampilkan:
- ✅ **PASSED** (hijau) - Test berhasil
- ✗ **FAILED** (merah) - Test gagal dengan detail error
- Summary di akhir: jumlah passed, failed, total, dan success rate

### Contoh Output

```
================================================================================
                    TEST OTOMATIS BACKEND API
         Validasi API dan Data Sesuai Kunci Jawaban
================================================================================

API Base URL: http://localhost:3000
Database: kupon_berhadiah

Memulai test...

[TEST SUITE 1] Validasi Struktur Database
[TEST] Database connection... ✓ PASSED
[TEST] Tabel prize_config memiliki 5 konfigurasi aktif... ✓ PASSED
[TEST] Tabel batches memiliki 2 batch... ✓ PASSED

...

================================================================================
                            TEST SUMMARY
================================================================================
Passed: 25
Failed: 0
Total: 25
Success Rate: 100.00%
================================================================================
```

## ⚠️ Troubleshooting

### Error: ECONNREFUSED
- **Penyebab**: Server backend tidak berjalan
- **Solusi**: Jalankan `npm start` terlebih dahulu

### Error: Database connection failed
- **Penyebab**: Koneksi database gagal
- **Solusi**: 
  - Cek konfigurasi di `config.js`
  - Pastikan MySQL server berjalan
  - Pastikan database `kupon_berhadiah` sudah dibuat

### Error: Expected 10000 coupons, found 0
- **Penyebab**: Kupon belum di-generate
- **Solusi**: Test akan otomatis generate kupon jika belum ada

### Error: DISTRIBUTION_CHECK should PASS
- **Penyebab**: Distribusi hadiah tidak sesuai
- **Solusi**: 
  - Cek konfigurasi `prize_config` di database
  - Pastikan generate kupon berhasil tanpa error
  - Re-generate kupon jika perlu

### Error: Found consecutive coupons with same prize
- **Penyebab**: Algoritma generate kupon tidak menghindari hadiah sama berurutan
- **Solusi**: Cek fungsi `eliminateConsecutivePrizes` di `utils/couponGenerator.js`

## 📌 Catatan Penting

1. **Test akan otomatis generate kupon** jika belum ada di database
2. **Test tidak akan menghapus data** yang sudah ada
3. **Pastikan server berjalan** sebelum menjalankan test
4. **Test membutuhkan waktu** beberapa menit karena banyak validasi

## 🔍 Validasi Sesuai Kunci Jawaban

Test script memvalidasi semua kriteria dari soal test interview:

1. ✅ Nomor seri 00001-10000 (total 10.000 kupon)
2. ✅ Distribusi hadiah: 50x100k, 100x50k, 250x20k, 500x10k, 1000x5k
3. ✅ Total hadiah = Rp 25.000.000
4. ✅ Hadiah terdistribusi acak, tidak ada hadiah sama pada nomor berurutan
5. ✅ Kupon dipacking per box isi 1.000 kupon (Total 10 box)
6. ✅ Komposisi hadiah per box sama
7. ✅ Proses produksi dibagi 2 batch, output tiap batch 5 box
8. ✅ Log laporan: nama operator, lokasi, waktu, output produksi tiap batch

## 📚 Referensi

- Soal Test: `Untitled-1` (attached file)
- Kunci Jawaban: `kunci_jawaban_test_interview.txt`
- API Documentation: Lihat file di folder `routes/`
- Database Schema: Lihat `dummy_data.sql`

