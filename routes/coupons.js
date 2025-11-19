var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua kupon
router.get('/', function(req, res, next) {
  const { batch_id, box_number, is_winner, generated_by } = req.query;
  let query = 'SELECT c.*, u.username as generated_by_username, u.full_name as generated_by_name FROM coupons c LEFT JOIN users u ON c.generated_by = u.user_id WHERE 1=1';
  const params = [];

  if (batch_id) {
    query += ' AND c.batch_id = ?';
    params.push(batch_id);
  }
  if (box_number) {
    query += ' AND c.box_number = ?';
    params.push(box_number);
  }
  if (is_winner !== undefined) {
    query += ' AND c.is_winner = ?';
    params.push(is_winner);
  }
  if (generated_by) {
    query += ' AND c.generated_by = ?';
    params.push(generated_by);
  }

  query += ' ORDER BY c.coupon_id DESC';

  config.query(query, params, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET kupon by coupon_number
router.get('/:coupon_number', function(req, res, next) {
  const couponNumber = req.params.coupon_number;
  config.query('SELECT c.*, u.username as generated_by_username, u.full_name as generated_by_name FROM coupons c LEFT JOIN users u ON c.generated_by = u.user_id WHERE c.coupon_number = ?', [couponNumber], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Kupon tidak ditemukan' });
    }
    res.json(results[0]);
  });
});

// POST membuat kupon baru
router.post('/', function(req, res, next) {
  const { coupon_number, prize_amount, prize_description, box_number, batch_id, is_winner, generated_by } = req.body;
  
  if (!coupon_number || !batch_id) {
    return res.status(400).json({ error: 'coupon_number dan batch_id wajib diisi' });
  }

  const query = 'INSERT INTO coupons (coupon_number, prize_amount, prize_description, box_number, batch_id, is_winner, generated_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
  config.query(query, [coupon_number, prize_amount, prize_description, box_number, batch_id, is_winner || 0, generated_by], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ 
      message: 'Kupon berhasil dibuat',
      coupon_number: coupon_number 
    });
  });
});

// PUT update kupon
router.put('/:coupon_number', function(req, res, next) {
  const couponNumber = req.params.coupon_number;
  const { prize_amount, prize_description, box_number, batch_id, is_winner, generated_by } = req.body;

  const query = 'UPDATE coupons SET prize_amount = ?, prize_description = ?, box_number = ?, batch_id = ?, is_winner = ?, generated_by = ? WHERE coupon_number = ?';
  config.query(query, [prize_amount, prize_description, box_number, batch_id, is_winner, generated_by, couponNumber], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Kupon tidak ditemukan' });
    }
    res.json({ message: 'Kupon berhasil diupdate' });
  });
});

// DELETE kupon
router.delete('/:coupon_number', function(req, res, next) {
  const couponNumber = req.params.coupon_number;
  config.query('DELETE FROM coupons WHERE coupon_number = ?', [couponNumber], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Kupon tidak ditemukan' });
    }
    res.json({ message: 'Kupon berhasil dihapus' });
  });
});

module.exports = router;

