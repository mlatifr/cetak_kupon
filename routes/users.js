var express = require('express');
var router = express.Router();
var config = require('../config');

// GET semua users
router.get('/', function(req, res, next) {
  const { role, is_active } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(is_active);
  }

  query += ' ORDER BY user_id DESC';

  config.query(query, params, function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// GET user by username
router.get('/:username', function(req, res, next) {
  const username = req.params.username;
  config.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json(results[0]);
  });
});

// POST membuat user baru
router.post('/', function(req, res, next) {
  const { username, email, full_name, role, is_active } = req.body;
  
  if (!username || !full_name) {
    return res.status(400).json({ error: 'username dan full_name wajib diisi' });
  }

  const query = 'INSERT INTO users (username, email, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)';
  config.query(query, [username, email, full_name, role, is_active !== undefined ? is_active : 1], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ 
      message: 'User berhasil dibuat',
      user_id: results.insertId,
      username: username
    });
  });
});

// PUT update user
router.put('/:username', function(req, res, next) {
  const username = req.params.username;
  const { email, full_name, role, is_active } = req.body;

  const query = 'UPDATE users SET email = ?, full_name = ?, role = ?, is_active = ? WHERE username = ?';
  config.query(query, [email, full_name, role, is_active, username], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ message: 'User berhasil diupdate' });
  });
});

// DELETE user (soft delete dengan set is_active = 0)
router.delete('/:username', function(req, res, next) {
  const username = req.params.username;
  config.query('UPDATE users SET is_active = 0 WHERE username = ?', [username], function(error, results, fields) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ message: 'User berhasil dinonaktifkan' });
  });
});

module.exports = router;
