var express = require('express');
var router = express.Router();
var config = require('../config');
const { generateCoupons, generateCouponsForBatch, saveCouponsToDb, getPrizeConfig } = require('../utils/couponGenerator');
const { validateBoxForBatch } = require('../utils/batchValidator');

// GET semua kupon
router.get('/', function(req, res, next) {
  const { batch_id, box_number, is_winner, generated_by } = req.query;
  
  // Validasi box_number sesuai batch_id jika keduanya ada
  if (batch_id && box_number) {
    validateBoxForBatch(batch_id, box_number, config, function(validationError, isValid, batchNumber) {
      if (validationError) {
        return res.status(validationError.statusCode || 500).json({ 
          error: validationError.message 
        });
      }
      if (!isValid) {
        return res.status(400).json({ 
          error: `Box ${box_number} tidak valid untuk batch_id ${batch_id}` 
        });
      }
      
      // Lanjutkan query jika validasi berhasil
      proceedWithQuery();
    });
  } else {
    proceedWithQuery();
  }
  
  function proceedWithQuery() {
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
  }
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

  // Validasi box_number sesuai batch_id
  if (box_number !== undefined && box_number !== null) {
    validateBoxForBatch(batch_id, box_number, config, function(validationError, isValid, batchNumber) {
      if (validationError) {
        return res.status(validationError.statusCode || 500).json({ 
          error: validationError.message 
        });
      }
      if (!isValid) {
        return res.status(400).json({ 
          error: `Box ${box_number} tidak valid untuk batch_id ${batch_id}` 
        });
      }
      
      // Lanjutkan insert jika validasi berhasil
      proceedWithInsert();
    });
  } else {
    proceedWithInsert();
  }
  
  function proceedWithInsert() {
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
  }
});

// PUT update kupon
router.put('/:coupon_number', function(req, res, next) {
  const couponNumber = req.params.coupon_number;
  const { prize_amount, prize_description, box_number, batch_id, is_winner, generated_by } = req.body;

  // Validasi box_number sesuai batch_id jika keduanya ada
  if (batch_id && box_number !== undefined && box_number !== null) {
    validateBoxForBatch(batch_id, box_number, config, function(validationError, isValid, batchNumber) {
      if (validationError) {
        return res.status(validationError.statusCode || 500).json({ 
          error: validationError.message 
        });
      }
      if (!isValid) {
        return res.status(400).json({ 
          error: `Box ${box_number} tidak valid untuk batch_id ${batch_id}` 
        });
      }
      
      // Lanjutkan update jika validasi berhasil
      proceedWithUpdate();
    });
  } else {
    proceedWithUpdate();
  }
  
  function proceedWithUpdate() {
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
  }
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

// POST /api/coupons/generate - Generate semua kupon untuk batch
router.post('/generate', async function(req, res, next) {
    const { batch_id, generated_by } = req.body;
    
    if (!batch_id) {
        return res.status(400).json({ error: 'batch_id wajib diisi' });
    }
    
    try {
        // Cek apakah batch sudah ada
        config.query('SELECT * FROM batches WHERE batch_id = ?', [batch_id], async function(error, batchResults) {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            if (batchResults.length === 0) {
                return res.status(404).json({ error: 'Batch tidak ditemukan' });
            }
            
            // Cek apakah kupon sudah pernah di-generate untuk batch ini
            config.query('SELECT COUNT(*) as count FROM coupons WHERE batch_id = ?', [batch_id], async function(error, countResults) {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                if (countResults[0].count > 0) {
                    return res.status(400).json({ error: 'Kupon untuk batch ini sudah pernah di-generate' });
                }
                
                try {
                    // Ambil batch_number dari batch
                    const batch = batchResults[0];
                    const batchNumber = batch.batch_number;
                    
                    // Ambil konfigurasi hadiah dari database
                    const prizeConfig = await getPrizeConfig(config);
                    
                    // Generate kupon untuk batch ini (5.000 kupon per batch)
                    // Batch 1: box 1-5, nomor 00001-05000
                    // Batch 2: box 6-10, nomor 05001-10000
                    const coupons = generateCouponsForBatch(batchNumber, prizeConfig);
                    
                    // Simpan ke database
                    await saveCouponsToDb(coupons, batch_id, generated_by, config);
                    
                    // Update status batch
                    config.query('UPDATE batches SET status = ? WHERE batch_id = ?', ['completed', batch_id], function(error) {
                        if (error) {
                            console.error('Error updating batch status:', error);
                        }
                    });
                    
                    res.status(201).json({
                        success: true,
                        message: 'Kupon berhasil di-generate',
                        totalCoupons: coupons.length,
                        batch_id: batch_id,
                        batch_number: batchNumber
                    });
                } catch (genError) {
                    res.status(500).json({
                        success: false,
                        message: 'Error generating coupons',
                        error: genError.message
                    });
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating coupons',
            error: error.message
        });
    }
});

module.exports = router;

