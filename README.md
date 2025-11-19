# Sistem Kupon Berhadiah Langsung

Backend API untuk sistem pencetakan kupon berhadiah langsung sesuai dengan soal test interview.

## 📋 Deskripsi

Sistem ini digunakan untuk mengelola produksi kupon berhadiah dengan kriteria:
- Nomor seri 00001-10000 (total 10.000 kupon)
- Distribusi hadiah: 50x100k, 100x50k, 250x20k, 500x10k, 1000x5k
- Total hadiah: Rp 25.000.000
- Kupon dipacking per box isi 1.000 kupon (Total 10 box)
- Komposisi hadiah per box sama
- Proses produksi dibagi 2 batch, output tiap batch 5 box

## 🚀 Quick Start

### Prasyarat

- Node.js (v12 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- npm atau yarn

### Instalasi

1. Clone repository atau extract project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup database:
   - Buat database `kupon_berhadiah`
   - Import struktur database (lihat `docs/README_DUMMY_DATA.md`)
   - Update konfigurasi di `config.js`

4. Insert dummy data (opsional):
   ```bash
   # Menggunakan SQL script
   mysql -u root -p kupon_berhadiah < dummy_data.sql
   
   # Atau menggunakan Node.js script
   node scripts/insertDummyData.js
   ```

### Menjalankan Server

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

### Menjalankan Test

```bash
npm test
```

Lihat dokumentasi lengkap di `docs/TEST_BACKEND.md`

## 📁 Struktur Project

```
cetak_kupon/
├── app.js                 # Entry point aplikasi
├── config.js              # Database configuration
├── package.json           # Dependencies
├── bin/
│   └── www                # Server starter
├── routes/                # API Routes
│   ├── batches.js         # Batch management
│   ├── coupons.js         # Coupon management & generation
│   ├── prizeConfig.js     # Prize configuration
│   ├── qcValidations.js   # QC validation
│   ├── productionLogs.js # Production logging
│   └── users.js           # User management
├── utils/                 # Helper functions
│   ├── couponGenerator.js # Generate kupon dengan Fisher-Yates Shuffle
│   ├── qcValidator.js     # QC validation functions
│   ├── reportGenerator.js # Production report generator
│   └── batchValidator.js  # Batch validation
├── scripts/               # Utility scripts
│   ├── insertDummyData.js # Insert dummy data
│   └── testBackend.js     # Test otomatis backend
├── docs/                  # Dokumentasi
│   ├── ANALISA_TOPOLOGI.md
│   ├── README_DUMMY_DATA.md
│   ├── STRUKTUR_FOLDER.md
│   └── TEST_BACKEND.md
└── dummy_data.sql         # SQL script untuk dummy data
```

## 🔌 API Endpoints

### Users
- `GET /api/users` - List semua users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Prize Config
- `GET /api/prize-config` - List semua konfigurasi hadiah
- `GET /api/prize-config/:id` - Get config by ID
- `POST /api/prize-config` - Create config
- `PUT /api/prize-config/:id` - Update config
- `DELETE /api/prize-config/:id` - Delete config

### Coupons
- `GET /api/coupons` - List semua kupon (dengan filter)
- `GET /api/coupons/:coupon_number` - Get kupon by nomor
- `POST /api/coupons` - Create kupon
- `POST /api/coupons/generate` - Generate kupon untuk batch
- `PUT /api/coupons/:coupon_number` - Update kupon
- `DELETE /api/coupons/:coupon_number` - Delete kupon

### Batches
- `GET /api/batches` - List semua batch
- `GET /api/batches/:batch_number` - Get batch by batch_number
- `GET /api/batches/:batch_number/detail` - Get batch detail dengan relasi
- `GET /api/batches/:batch_number/report` - Get production report
- `POST /api/batches` - Create batch
- `PUT /api/batches/:batch_number` - Update batch
- `DELETE /api/batches/:batch_number` - Delete batch

### QC Validations
- `GET /api/qc-validations` - List semua validasi QC
- `GET /api/qc-validations/:id` - Get validasi by ID
- `GET /api/qc-validations/batch/:batch_id` - Get validasi untuk batch
- `POST /api/qc-validations` - Create validasi
- `POST /api/qc-validations/batch/:batch_id/validate` - Run QC validation otomatis
- `PUT /api/qc-validations/:id` - Update validasi
- `DELETE /api/qc-validations/:id` - Delete validasi

### Production Logs
- `GET /api/production-logs` - List semua production logs
- `GET /api/production-logs/:id` - Get log by ID
- `GET /api/production-logs/batch/:batch_id` - Get logs untuk batch
- `POST /api/production-logs` - Create log
- `PUT /api/production-logs/:id` - Update log
- `DELETE /api/production-logs/:id` - Delete log

## 🗄️ Database

Database menggunakan MySQL dengan struktur:

- `users` - User management
- `prize_config` - Konfigurasi hadiah
- `batches` - Batch produksi
- `coupons` - Data kupon
- `qc_validations` - Hasil validasi QC
- `production_logs` - Log produksi

Lihat dokumentasi lengkap di `docs/README_DUMMY_DATA.md` untuk struktur database dan cara insert data.

## 🧪 Testing

Script test otomatis tersedia untuk memverifikasi semua API dan validasi data:

```bash
npm test
```

Test akan memverifikasi:
- ✅ Struktur database
- ✅ API endpoints
- ✅ Generate kupon
- ✅ Validasi data kupon (distribusi, komposisi, consecutive check)
- ✅ QC validation
- ✅ Production report
- ✅ Production logs

Lihat dokumentasi lengkap di `docs/TEST_BACKEND.md`

## 📚 Dokumentasi

Semua dokumentasi tersedia di folder `docs/`:

- `ANALISA_TOPOLOGI.md` - Analisa topologi & status project
- `README_DUMMY_DATA.md` - Panduan insert dummy data
- `STRUKTUR_FOLDER.md` - Dokumentasi struktur folder
- `TEST_BACKEND.md` - Dokumentasi test backend

## 🛠️ Teknologi

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Language**: JavaScript (ES6+)

## 📝 License

Project ini dibuat untuk keperluan test interview.

## 👤 Author

Dibuat sesuai dengan soal test interview JIP - Solution Architect / Software Engineer.

