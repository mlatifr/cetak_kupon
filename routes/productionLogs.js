var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua production log
router.get('/', function(req, res, next) {
  const { batch_id, action_type, operator_name, location, operator_user_id } = req.query;
  let query = 'SELECT p.*, u.username as operator_username, u.full_name as operator_name_full FROM production_logs p LEFT JOIN users u ON p.operator_user_id = u.user_id WHERE 1=1';
  const params = [];

  if (batch_id) {
    query += ' AND p.batch_id = ?';
    params.push(batch_id);
  }
  if (action_type) {
    query += ' AND p.action_type = ?';
    params.push(action_type);
  }
  if (operator_name) {
    query += ' AND p.operator_name LIKE ?';
    params.push(`%${operator_name}%`);
  }
  if (location) {
    query += ' AND p.location LIKE ?';
    params.push(`%${location}%`);
  }
  if (operator_user_id) {
    query += ' AND p.operator_user_id = ?';
    params.push(operator_user_id);
  }

  query += ' ORDER BY p.timestamp DESC';

  config.query(query, params, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET production log by ID
router.get('/:id', function(req, res, next) {
  const logId = req.params.id;
  config.query('SELECT p.*, u.username as operator_username, u.full_name as operator_name_full FROM production_logs p LEFT JOIN users u ON p.operator_user_id = u.user_id WHERE p.log_id = ?', [logId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Production log tidak ditemukan' });
    }
    res.json(results[0]);
  });
});

// GET production log by batch_id
router.get('/batch/:batch_id', function(req, res, next) {
  const batchId = req.params.batch_id;
  config.query('SELECT p.*, u.username as operator_username, u.full_name as operator_name_full FROM production_logs p LEFT JOIN users u ON p.operator_user_id = u.user_id WHERE p.batch_id = ? ORDER BY p.timestamp DESC', [batchId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// POST membuat production log baru
router.post('/', function(req, res, next) {
  const { batch_id, action_type, action_description, operator_name, location, metadata, operator_user_id } = req.body;
  
  if (!batch_id || !action_type || !operator_name) {
    return res.status(400).json({ error: 'batch_id, action_type, dan operator_name wajib diisi' });
  }

  const query = 'INSERT INTO production_logs (batch_id, action_type, action_description, operator_name, location, metadata, operator_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
  config.query(query, [batch_id, action_type, action_description, operator_name, location, metadata, operator_user_id], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ 
      message: 'Production log berhasil dibuat',
      log_id: results.insertId 
    });
  });
});

// PUT update production log
router.put('/:id', function(req, res, next) {
  const logId = req.params.id;
  const { action_type, action_description, operator_name, location, metadata, operator_user_id } = req.body;

  const query = 'UPDATE production_logs SET action_type = ?, action_description = ?, operator_name = ?, location = ?, metadata = ?, operator_user_id = ? WHERE log_id = ?';
  config.query(query, [action_type, action_description, operator_name, location, metadata, operator_user_id, logId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Production log tidak ditemukan' });
    }
    res.json({ message: 'Production log berhasil diupdate' });
  });
});

// DELETE production log
router.delete('/:id', function(req, res, next) {
  const logId = req.params.id;
  config.query('DELETE FROM production_logs WHERE log_id = ?', [logId], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Production log tidak ditemukan' });
    }
    res.json({ message: 'Production log berhasil dihapus' });
  });
});

module.exports = router;

