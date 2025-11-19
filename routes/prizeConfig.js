var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua konfigurasi hadiah
router.get('/', function(req, res, next) {
  config.query('SELECT p.*, u1.username as created_by_username, u1.full_name as created_by_name, u2.username as updated_by_username, u2.full_name as updated_by_name FROM prize_config p LEFT JOIN users u1 ON p.created_by = u1.user_id LEFT JOIN users u2 ON p.updated_by = u2.user_id ORDER BY p.config_id DESC', function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET konfigurasi hadiah by ID
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

