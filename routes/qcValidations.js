var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua validasi QC
router.get('/', function(req, res, next) {
  const { batch_id, validation_status, validated_by, validated_by_user_id } = req.query;
  let query = 'SELECT q.*, u.username as validated_by_username, u.full_name as validated_by_name FROM qc_validations q LEFT JOIN users u ON q.validated_by_user_id = u.user_id WHERE 1=1';
  const params = [];

  if (batch_id) {
    query += ' AND q.batch_id = ?';
    params.push(batch_id);
  }
  if (validation_status) {
    query += ' AND q.validation_status = ?';
    params.push(validation_status);
  }
  if (validated_by) {
    query += ' AND q.validated_by LIKE ?';
    params.push(`%${validated_by}%`);
  }
  if (validated_by_user_id) {
    query += ' AND q.validated_by_user_id = ?';
    params.push(validated_by_user_id);
  }

  query += ' ORDER BY q.qc_id DESC';

  config.query(query, params, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET validasi QC by ID
router.get('/:id', function(req, res, next) {
  const qcId = req.params.id;
  config.query('SELECT q.*, u.username as validated_by_username, u.full_name as validated_by_name FROM qc_validations q LEFT JOIN users u ON q.validated_by_user_id = u.user_id WHERE q.qc_id = ?', [qcId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Validasi QC tidak ditemukan' });
    }
    res.json(results[0]);
  });
});

// GET validasi QC by batch_id
router.get('/batch/:batch_id', function(req, res, next) {
  const batchId = req.params.batch_id;
  config.query('SELECT q.*, u.username as validated_by_username, u.full_name as validated_by_name FROM qc_validations q LEFT JOIN users u ON q.validated_by_user_id = u.user_id WHERE q.batch_id = ? ORDER BY q.validated_at DESC', [batchId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// POST membuat validasi QC baru
router.post('/', function(req, res, next) {
  const { batch_id, validation_type, validation_status, validation_details, validated_by, validated_by_user_id } = req.body;
  
  if (!batch_id || !validation_type || !validation_status) {
    return res.status(400).json({ error: 'batch_id, validation_type, dan validation_status wajib diisi' });
  }

  const query = 'INSERT INTO qc_validations (batch_id, validation_type, validation_status, validation_details, validated_by, validated_by_user_id) VALUES (?, ?, ?, ?, ?, ?)';
  config.query(query, [batch_id, validation_type, validation_status, validation_details, validated_by, validated_by_user_id], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ 
      message: 'Validasi QC berhasil dibuat',
      qc_id: results.insertId 
    });
  });
});

// PUT update validasi QC
router.put('/:id', function(req, res, next) {
  const qcId = req.params.id;
  const { validation_type, validation_status, validation_details, validated_by, validated_by_user_id } = req.body;

  const query = 'UPDATE qc_validations SET validation_type = ?, validation_status = ?, validation_details = ?, validated_by = ?, validated_by_user_id = ? WHERE qc_id = ?';
  config.query(query, [validation_type, validation_status, validation_details, validated_by, validated_by_user_id, qcId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Validasi QC tidak ditemukan' });
    }
    res.json({ message: 'Validasi QC berhasil diupdate' });
  });
});

// DELETE validasi QC
router.delete('/:id', function(req, res, next) {
  const qcId = req.params.id;
  config.query('DELETE FROM qc_validations WHERE qc_id = ?', [qcId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Validasi QC tidak ditemukan' });
    }
    res.json({ message: 'Validasi QC berhasil dihapus' });
  });
});

module.exports = router;

