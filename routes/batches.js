var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua batch
router.get('/', function(req, res, next) {
  const { status, operator_name, location, operator_id, created_by } = req.query;
  let query = 'SELECT b.*, u1.username as created_by_username, u1.full_name as created_by_name, u2.username as operator_username, u2.full_name as operator_name_full FROM batches b LEFT JOIN users u1 ON b.created_by = u1.user_id LEFT JOIN users u2 ON b.operator_id = u2.user_id WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }
  if (operator_name) {
    query += ' AND b.operator_name LIKE ?';
    params.push(`%${operator_name}%`);
  }
  if (location) {
    query += ' AND b.location LIKE ?';
    params.push(`%${location}%`);
  }
  if (operator_id) {
    query += ' AND b.operator_id = ?';
    params.push(operator_id);
  }
  if (created_by) {
    query += ' AND b.created_by = ?';
    params.push(created_by);
  }

  query += ' ORDER BY b.batch_id DESC';

  config.query(query, params, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET batch by batch_number
router.get('/:batch_number', function(req, res, next) {
  const batchNumber = req.params.batch_number;
  config.query('SELECT b.*, u1.username as created_by_username, u1.full_name as created_by_name, u2.username as operator_username, u2.full_name as operator_name_full FROM batches b LEFT JOIN users u1 ON b.created_by = u1.user_id LEFT JOIN users u2 ON b.operator_id = u2.user_id WHERE b.batch_number = ?', [batchNumber], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Batch tidak ditemukan' });
    }
    res.json(results[0]);
  });
});

// GET detail batch dengan relasi (coupons, qc_validations, production_logs)
router.get('/:batch_number/detail', function(req, res, next) {
  const batchNumber = req.params.batch_number;
  
  // Ambil data batch
  config.query('SELECT * FROM batches WHERE batch_number = ?', [batchNumber], function(error, batchResults, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (batchResults.length === 0) {
      return res.status(404).json({ error: 'Batch tidak ditemukan' });
    }

    const batch = batchResults[0];
    const batchId = batch.batch_id;

    // Ambil coupons
    config.query('SELECT * FROM coupons WHERE batch_id = ?', [batchId], function(error, couponResults) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Ambil qc_validations
      config.query('SELECT * FROM qc_validations WHERE batch_id = ?', [batchId], function(error, qcResults) {
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        // Ambil production_logs
        config.query('SELECT * FROM production_logs WHERE batch_id = ? ORDER BY timestamp DESC', [batchId], function(error, logResults) {
          if (error) {
            return res.status(500).json({ error: error.message });
          }

          res.json({
            batch: batch,
            coupons: couponResults,
            qc_validations: qcResults,
            production_logs: logResults
          });
        });
      });
    });
  });
});

// POST membuat batch baru
router.post('/', function(req, res, next) {
  const { batch_number, operator_name, location, production_date, total_boxes, status, created_by, operator_id } = req.body;
  
  if (!batch_number || !operator_name || !location) {
    return res.status(400).json({ error: 'batch_number, operator_name, dan location wajib diisi' });
  }

  const query = 'INSERT INTO batches (batch_number, operator_name, location, production_date, total_boxes, status, created_by, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  config.query(query, [batch_number, operator_name, location, production_date || new Date(), total_boxes, status || 'pending', created_by, operator_id], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ 
      message: 'Batch berhasil dibuat',
      batch_id: results.insertId,
      batch_number: batch_number
    });
  });
});

// PUT update batch
router.put('/:batch_number', function(req, res, next) {
  const batchNumber = req.params.batch_number;
  const { operator_name, location, production_date, total_boxes, status, operator_id } = req.body;

  const query = 'UPDATE batches SET operator_name = ?, location = ?, production_date = ?, total_boxes = ?, status = ?, operator_id = ? WHERE batch_number = ?';
  config.query(query, [operator_name, location, production_date, total_boxes, status, operator_id, batchNumber], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Batch tidak ditemukan' });
    }
    res.json({ message: 'Batch berhasil diupdate' });
  });
});

// DELETE batch
router.delete('/:batch_number', function(req, res, next) {
  const batchNumber = req.params.batch_number;
  config.query('DELETE FROM batches WHERE batch_number = ?', [batchNumber], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Batch tidak ditemukan' });
    }
    res.json({ message: 'Batch berhasil dihapus' });
  });
});

module.exports = router;

