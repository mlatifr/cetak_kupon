-- ============================================================================
-- DUMMY DATA UNTUK SOAL TEST INTERVIEW
-- Sistem Kupon Berhadiah Langsung
-- ============================================================================

-- Hapus data lama (optional, hati-hati!)
-- DELETE FROM qc_validations;
-- DELETE FROM production_logs;
-- DELETE FROM coupons;
-- DELETE FROM batches;
-- DELETE FROM prize_config;
-- DELETE FROM users;

-- ============================================================================
-- 1. INSERT USERS (untuk created_by, operator_id, generated_by, dll)
-- ============================================================================
INSERT INTO users (username, email, full_name, role, is_active) VALUES
('admin', 'admin@xyz.com', 'Administrator', 'admin', 1),
('amir', 'amir@xyz.com', 'Amir', 'operator', 1),
('nando', 'nando@xyz.com', 'Nando', 'operator', 1),
('qc_staff', 'qc@xyz.com', 'QC Staff', 'qc', 1);

-- ============================================================================
-- 2. INSERT PRIZE_CONFIG (Konfigurasi Hadiah)
-- Sesuai soal: 50x100k, 100x50k, 250x20k, 500x10k, 1000x5k
-- ============================================================================
INSERT INTO prize_config (prize_amount, total_coupons, coupons_per_box, is_active, created_by) VALUES
(100000, 50, 5, 1, 1),
(50000, 100, 10, 1, 1),
(20000, 250, 25, 1, 1),
(10000, 500, 50, 1, 1),
(5000, 1000, 100, 1, 1);

-- ============================================================================
-- 3. INSERT BATCHES (2 Batch sesuai contoh di soal)
-- Batch 1: Amir, Surabaya, 01-Jan-1901 / 14:00
-- Batch 2: Nando, Surabaya, 02-Jan-1901 / 10:00
-- ============================================================================
INSERT INTO batches (batch_number, operator_name, location, production_date, total_boxes, status, created_by, operator_id) VALUES
(1, 'Amir', 'Surabaya', '2024-01-01 14:00:00', 5, 'pending', 1, 2),
(2, 'Nando', 'Surabaya', '2024-01-02 10:00:00', 5, 'pending', 1, 3);

-- ============================================================================
-- 4. INSERT PRODUCTION_LOGS (Log Produksi)
-- ============================================================================
-- Log untuk Batch 1
INSERT INTO production_logs (batch_id, action_type, action_description, operator_name, location, operator_user_id) VALUES
(1, 'BATCH_CREATED', 'Batch produksi dibuat', 'Amir', 'Surabaya', 2),
(1, 'GENERATE_STARTED', 'Proses generate kupon dimulai', 'Amir', 'Surabaya', 2);

-- Log untuk Batch 2
INSERT INTO production_logs (batch_id, action_type, action_description, operator_name, location, operator_user_id) VALUES
(2, 'BATCH_CREATED', 'Batch produksi dibuat', 'Nando', 'Surabaya', 3),
(2, 'GENERATE_STARTED', 'Proses generate kupon dimulai', 'Nando', 'Surabaya', 3);

-- ============================================================================
-- 5. INSERT QC_VALIDATIONS (Validasi QC - akan diisi setelah generate kupon)
-- Untuk contoh, kita buat dummy data
-- ============================================================================
-- QC untuk Batch 1 (contoh - akan diisi setelah generate)
INSERT INTO qc_validations (batch_id, validation_type, validation_status, validation_details, validated_by, validated_by_user_id) VALUES
(1, 'DISTRIBUTION_CHECK', 'PENDING', '{"message": "Menunggu generate kupon"}', 'QC Staff', 4),
(1, 'BOX_COMPOSITION', 'PENDING', '{"message": "Menunggu generate kupon"}', 'QC Staff', 4),
(1, 'CONSECUTIVE_CHECK', 'PENDING', '{"message": "Menunggu generate kupon"}', 'QC Staff', 4);

-- QC untuk Batch 2 (contoh - akan diisi setelah generate)
INSERT INTO qc_validations (batch_id, validation_type, validation_status, validation_details, validated_by, validated_by_user_id) VALUES
(2, 'DISTRIBUTION_CHECK', 'PENDING', '{"message": "Menunggu generate kupon"}', 'QC Staff', 4),
(2, 'BOX_COMPOSITION', 'PENDING', '{"message": "Menunggu generate kupon"}', 'QC Staff', 4),
(2, 'CONSECUTIVE_CHECK', 'PENDING', '{"message": "Menunggu generate kupon"}', 'QC Staff', 4);

-- ============================================================================
-- CATATAN:
-- 1. Coupons TIDAK di-insert manual karena akan di-generate oleh fungsi
--    generateCoupons() melalui API POST /api/coupons/generate
-- 2. Setelah generate kupon, status batch akan otomatis berubah menjadi 'completed'
-- 3. Setelah generate, bisa update qc_validations dengan hasil validasi
-- ============================================================================

