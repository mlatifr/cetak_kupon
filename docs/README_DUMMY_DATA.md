# Dummy Data untuk Soal Test Interview

File-file untuk insert dummy data sesuai dengan soal test interview.

**Versi Terbaru**: Script sekarang sudah include **insert kupon otomatis** (20.000 kupon) dengan batch insert per 1.000 untuk performa optimal.

## File yang Tersedia

1. **dummy_data.sql** - File SQL script untuk insert data langsung ke database
2. **scripts/insertDummyData.js** - Script Node.js untuk insert data (lebih fleksibel)

## Data yang Akan Di-insert

### 1. Users (4 users)
- **admin** - Administrator
- **amir** - Operator (untuk Batch 1)
- **nando** - Operator (untuk Batch 2)
- **qc_staff** - QC Staff

### 2. Prize Config (5 konfigurasi hadiah)
- 50 kupon × Rp 100.000 (5 per box)
- 100 kupon × Rp 50.000 (10 per box)
- 250 kupon × Rp 20.000 (25 per box)
- 500 kupon × Rp 10.000 (50 per box)
- 1000 kupon × Rp 5.000 (100 per box)

### 3. Batches (2 batch sesuai contoh soal)
- **Batch 1**: Operator Amir, Lokasi Surabaya, Tanggal 01-Jan-2024 / 14:00
- **Batch 2**: Operator Nando, Lokasi Surabaya, Tanggal 02-Jan-2024 / 10:00

### 4. Production Logs
- Log untuk setiap batch (BATCH_CREATED, GENERATE_STARTED)

### 5. QC Validations
- Validasi QC untuk setiap batch (DISTRIBUTION_CHECK, BOX_COMPOSITION, CONSECUTIVE_CHECK)

### 6. Coupons (10.000 kupon total)
- **5.000 kupon untuk Batch 1** (5 box × 1.000 kupon, nomor 00001-05000, box 1-5)
- **5.000 kupon untuk Batch 2** (5 box × 1.000 kupon, nomor 05001-10000, box 6-10)
- Distribusi hadiah sesuai kriteria soal
- Komposisi hadiah per box sama (190 berhadiah + 810 tidak beruntung per box)
- Insert otomatis dengan batch insert per 500 kupon (untuk performa)

## Cara Menggunakan

### Opsi 1: Menggunakan SQL Script (dummy_data.sql)

```bash
# Masuk ke MySQL
mysql -u root -p kupon_berhadiah

# Atau langsung execute file
mysql -u root -p kupon_berhadiah < dummy_data.sql
```

### Opsi 2: Menggunakan Node.js Script (Recommended)

```bash
# Jalankan script (normal mode - skip jika data sudah ada)
node scripts/insertDummyData.js

# Jalankan dengan force mode (hapus dan insert ulang kupon jika sudah ada)
node scripts/insertDummyData.js --force
# atau
node scripts/insertDummyData.js -f
```

**Fitur Script:**
- Insert semua data secara berurutan (users, prize config, batches, logs, QC, dan **coupons**)
- Skip data yang sudah ada (tidak error jika duplicate)
- **Generate dan insert 10.000 kupon otomatis** (5.000 per batch)
- Batch 1: box 1-5, nomor 00001-05000
- Batch 2: box 6-10, nomor 05001-10000
- Batch insert per 500 kupon untuk performa optimal
- Progress indicator menampilkan persentase insert
- Auto-cleanup duplicate entries
- Update status batch menjadi `completed` setelah insert kupon
- Menampilkan progress dan hasil detail
- Validasi nomor kupon untuk memastikan range yang benar

## Catatan Penting

1. **Coupons di-insert otomatis** oleh script `insertDummyData.js`
   - Script akan generate 5.000 kupon per batch menggunakan algoritma Fisher-Yates Shuffle
   - Batch 1: box 1-5, nomor 00001-05000
   - Batch 2: box 6-10, nomor 05001-10000
   - Insert dilakukan per 500 kupon untuk performa optimal
   - Total: **10.000 kupon** (5.000 untuk Batch 1, 5.000 untuk Batch 2)
   - Komposisi hadiah per box sama: 190 berhadiah + 810 tidak beruntung

2. **Flag `--force` atau `-f`**:
   - Jika kupon sudah ada, script akan menghapus kupon lama terlebih dahulu
   - Berguna untuk reset dan insert ulang data kupon

3. **Status Batch**:
   - Setelah insert kupon selesai, status batch otomatis berubah menjadi `completed`
   - Tidak perlu generate kupon manual melalui API

4. **Alternatif Generate via API** (jika tidak menggunakan seed script):
   ```bash
   # Generate kupon untuk Batch 1
   POST http://localhost:3000/api/coupons/generate
   Body: {
     "batch_id": 1,
     "generated_by": 1
   }

   # Generate kupon untuk Batch 2
   POST http://localhost:3000/api/coupons/generate
   Body: {
     "batch_id": 2,
     "generated_by": 1
   }
   ```

5. **Setelah insert**, bisa update `qc_validations` dengan hasil validasi yang sebenarnya

## Verifikasi Data

Setelah insert, verifikasi data dengan:

```sql
-- Cek users
SELECT * FROM users;

-- Cek prize config
SELECT * FROM prize_config;

-- Cek batches
SELECT * FROM batches;

-- Cek production logs
SELECT * FROM production_logs;

-- Cek QC validations
SELECT * FROM qc_validations;

-- Cek coupons (setelah seed script)
SELECT COUNT(*) as total_coupons FROM coupons;
SELECT batch_id, COUNT(*) as count FROM coupons GROUP BY batch_id;
SELECT box_number, COUNT(*) as count, SUM(prize_amount) as total_prize 
FROM coupons 
WHERE batch_id = 1 
GROUP BY box_number;

-- Verifikasi distribusi hadiah per batch
SELECT 
    batch_id,
    prize_amount,
    COUNT(*) as jumlah_kupon,
    SUM(prize_amount) as total_nominal
FROM coupons 
WHERE prize_amount > 0
GROUP BY batch_id, prize_amount
ORDER BY batch_id, prize_amount DESC;
```

## Troubleshooting

### Error: ER_DUP_ENTRY
- Data sudah ada di database
- Script Node.js akan skip data yang duplicate (kecuali kupon)
- Untuk kupon, gunakan flag `--force` untuk hapus dan insert ulang
- Untuk SQL script, comment atau hapus bagian yang sudah ada

### Error: Foreign key constraint fails
- Pastikan insert data sesuai urutan: users → prize_config → batches → production_logs → qc_validations → coupons
- Script Node.js sudah mengikuti urutan yang benar

### Data tidak muncul
- Pastikan koneksi database benar di `config.js`
- Pastikan database `kupon_berhadiah` sudah dibuat
- Pastikan semua tabel sudah dibuat sesuai struktur di kunci jawaban

### Hanya 5.950 kupon ter-generate (bukan 10.000)
- **Sudah diperbaiki**: Script sekarang memastikan setiap box tetap 1000 kupon
- Jika masih terjadi, pastikan prize_config memiliki 5 konfigurasi aktif dengan total 1900 prize coupons
- Cek dengan: `SELECT * FROM prize_config WHERE is_active = 1;`

### Duplicate entry saat insert kupon
- Script sudah memiliki auto-cleanup untuk duplicate entries
- Jika masih error, gunakan flag `--force` untuk hapus semua kupon terlebih dahulu
- Atau hapus manual: `DELETE FROM coupons WHERE batch_id IN (1, 2);`

### Progress insert kupon lambat
- Normal: Insert 10.000 kupon membutuhkan waktu beberapa detik
- Script menggunakan batch insert per 1.000 kupon dengan delay 10ms antar batch
- Ini untuk menghindari overload database

## Contoh Output

Saat menjalankan script, Anda akan melihat output seperti ini:

```
========================================
INSERT DUMMY DATA - SOAL TEST INTERVIEW
========================================

Inserting users...
✓ User admin inserted (ID: 1)
✓ User amir inserted (ID: 2)
...

Inserting prize config...
✓ Old prize configs deactivated
✓ Prize config 100000 updated
...

Generating and inserting coupons for batch 1...
  → Prize config loaded: 1900 total prize coupons
✓ Generated 5000 coupons for batch 1 (batch_id: 1)
  → Coupon range: 00001 - 05000 (should be 00001 - 05000)
  → Inserted 500/5000 coupons (10.0%)
  → Inserted 1000/5000 coupons (20.0%)
  ...
  → Inserted 5000/5000 coupons (100.0%)
✓ All 5000 coupons inserted for batch 1

========================================
✓ Semua dummy data berhasil di-insert!
========================================

Data yang di-insert:
- 4 Users
- 5 Prize Config
- 2 Batches
- 4 Production Logs
- 6 QC Validations
- 10.000 Coupons (5.000 per batch)

✓ Batch 1: Status = completed
✓ Batch 2: Status = completed
```

## Summary

Setelah menjalankan script `insertDummyData.js`, Anda akan mendapatkan:

- ✅ **4 Users** (admin, amir, nando, qc_staff)
- ✅ **5 Prize Config** (konfigurasi hadiah sesuai soal)
- ✅ **2 Batches** (Batch 1: Amir, Batch 2: Nando)
- ✅ **4 Production Logs** (log untuk setiap batch)
- ✅ **6 QC Validations** (validasi QC untuk setiap batch)
- ✅ **10.000 Coupons** (5.000 per batch, 5 box × 1.000 kupon per batch)
  - Batch 1: box 1-5, nomor 00001-05000
  - Batch 2: box 6-10, nomor 05001-10000

**Total waktu eksekusi**: ~10-30 detik (tergantung performa database)

Semua data sudah siap untuk testing dan demo sesuai dengan soal test interview!

