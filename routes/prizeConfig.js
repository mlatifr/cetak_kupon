var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua konfigurasi hadiah
// Default hanya menampilkan yang aktif (is_active = 1) untuk mencegah total kupon melebihi 10.000
// Gunakan query parameter ?include_inactive=1 untuk menampilkan semua (termasuk non-aktif)
router.get('/', function(req, res, next) {
  const includeInactive = req.query.include_inactive === '1' || req.query.include_inactive === 'true';
  let query = 'SELECT p.*, u1.username as created_by_username, u1.full_name as created_by_name, u2.username as updated_by_username, u2.full_name as updated_by_name FROM prize_config p LEFT JOIN users u1 ON p.created_by = u1.user_id LEFT JOIN users u2 ON p.updated_by = u2.user_id';
  
  if (!includeInactive) {
    query += ' WHERE p.is_active = 1';
  }
  
  query += ' ORDER BY p.config_id DESC';
  
  config.query(query, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET /api/prize-config/summary - Summary total kupon dari konfigurasi aktif
// Endpoint ini menghitung total kupon hanya dari konfigurasi yang aktif (is_active = 1)
// Memastikan total kupon tidak melebihi 10.000 sesuai soal
// HARUS diletakkan sebelum route /:id agar tidak tertangkap sebagai parameter
router.get('/summary', function(req, res, next) {
  config.query(`
    SELECT 
      COUNT(*) as total_configs,
      SUM(total_coupons) as total_prize_coupons,
      SUM(CASE WHEN is_active = 1 THEN total_coupons ELSE 0 END) as active_prize_coupons,
      SUM(CASE WHEN is_active = 0 THEN total_coupons ELSE 0 END) as inactive_prize_coupons,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_configs,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_configs
    FROM prize_config
  `, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    const summary = results[0];
    const expectedTotal = 10000; // Sesuai soal: 10.000 kupon total
    const expectedPrizeCoupons = 1900; // Sesuai soal: 1.900 kupon berhadiah
    const expectedNonPrizeCoupons = 8100; // 8.100 kupon tidak beruntung
    
    res.json({
      ...summary,
      expected_total_coupons: expectedTotal,
      expected_prize_coupons: expectedPrizeCoupons,
      expected_non_prize_coupons: expectedNonPrizeCoupons,
      is_valid: summary.active_prize_coupons === expectedPrizeCoupons,
      message: summary.active_prize_coupons === expectedPrizeCoupons 
        ? 'Konfigurasi aktif sesuai dengan soal (1.900 kupon berhadiah)' 
        : `Peringatan: Total kupon berhadiah dari konfigurasi aktif (${summary.active_prize_coupons}) tidak sesuai dengan soal (${expectedPrizeCoupons})`
    });
  });
});

// GET konfigurasi hadiah by ID
// Catatan: API ini mengembalikan konfigurasi berdasarkan ID, termasuk yang non-aktif
// Untuk generate kupon, sistem hanya menggunakan konfigurasi dengan is_active = 1
router.get('/:id', function(req, res, next) {
  const configId = req.params.id;
  config.query('SELECT p.*, u1.username as created_by_username, u1.full_name as created_by_name, u2.username as updated_by_username, u2.full_name as updated_by_name FROM prize_config p LEFT JOIN users u1 ON p.created_by = u1.user_id LEFT JOIN users u2 ON p.updated_by = u2.user_id WHERE p.config_id = ?', [configId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Konfigurasi hadiah tidak ditemukan' });
    }
    res.json(results[0]);
  });
});

// POST membuat konfigurasi hadiah baru
router.post('/', function(req, res, next) {
  const { prize_amount, total_coupons, coupons_per_box, is_active, created_by } = req.body;
  
  if (!prize_amount || !total_coupons || !coupons_per_box) {
    return res.status(400).json({ error: 'prize_amount, total_coupons, dan coupons_per_box wajib diisi' });
  }

  const query = 'INSERT INTO prize_config (prize_amount, total_coupons, coupons_per_box, is_active, created_by) VALUES (?, ?, ?, ?, ?)';
  config.query(query, [prize_amount, total_coupons, coupons_per_box, is_active || 1, created_by], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ 
      message: 'Konfigurasi hadiah berhasil dibuat',
      config_id: results.insertId 
    });
  });
});

// PUT update konfigurasi hadiah
router.put('/:id', function(req, res, next) {
  const configId = req.params.id;
  const { prize_amount, total_coupons, coupons_per_box, is_active, updated_by } = req.body;

  const query = 'UPDATE prize_config SET prize_amount = ?, total_coupons = ?, coupons_per_box = ?, is_active = ?, updated_by = ? WHERE config_id = ?';
  config.query(query, [prize_amount, total_coupons, coupons_per_box, is_active, updated_by, configId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Konfigurasi hadiah tidak ditemukan' });
    }
    res.json({ message: 'Konfigurasi hadiah berhasil diupdate' });
  });
});

// DELETE konfigurasi hadiah
router.delete('/:id', function(req, res, next) {
  const configId = req.params.id;
  config.query('DELETE FROM prize_config WHERE config_id = ?', [configId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Konfigurasi hadiah tidak ditemukan' });
    }
    res.json({ message: 'Konfigurasi hadiah berhasil dihapus' });
  });
});

module.exports = router;

