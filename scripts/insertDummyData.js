// scripts/insertDummyData.js
// Script untuk insert dummy data sesuai soal test interview

var config = require('../config');
const { generateCouponsForBatch, getPrizeConfig } = require('../utils/couponGenerator');

// Data dummy
const dummyData = {
    users: [
        { username: 'admin', email: 'admin@xyz.com', full_name: 'Administrator', role: 'admin', is_active: 1 },
        { username: 'amir', email: 'amir@xyz.com', full_name: 'Amir', role: 'operator', is_active: 1 },
        { username: 'nando', email: 'nando@xyz.com', full_name: 'Nando', role: 'operator', is_active: 1 },
        { username: 'qc_staff', email: 'qc@xyz.com', full_name: 'QC Staff', role: 'qc', is_active: 1 }
    ],
    prizeConfig: [
        { prize_amount: 100000, total_coupons: 50, coupons_per_box: 5, is_active: 1 },
        { prize_amount: 50000, total_coupons: 100, coupons_per_box: 10, is_active: 1 },
        { prize_amount: 20000, total_coupons: 250, coupons_per_box: 25, is_active: 1 },
        { prize_amount: 10000, total_coupons: 500, coupons_per_box: 50, is_active: 1 },
        { prize_amount: 5000, total_coupons: 1000, coupons_per_box: 100, is_active: 1 }
    ],
    batches: [
        { batch_number: 1, operator_name: 'Amir', location: 'Surabaya', production_date: '2024-01-01 14:00:00', total_boxes: 5, status: 'pending', created_by: 1, operator_id: 2 },
        { batch_number: 2, operator_name: 'Nando', location: 'Surabaya', production_date: '2024-01-02 10:00:00', total_boxes: 5, status: 'pending', created_by: 1, operator_id: 3 }
    ],
    productionLogs: [
        { batch_id: 1, action_type: 'BATCH_CREATED', action_description: 'Batch produksi dibuat', operator_name: 'Amir', location: 'Surabaya', operator_user_id: 2 },
        { batch_id: 1, action_type: 'GENERATE_STARTED', action_description: 'Proses generate kupon dimulai', operator_name: 'Amir', location: 'Surabaya', operator_user_id: 2 },
        { batch_id: 2, action_type: 'BATCH_CREATED', action_description: 'Batch produksi dibuat', operator_name: 'Nando', location: 'Surabaya', operator_user_id: 3 },
        { batch_id: 2, action_type: 'GENERATE_STARTED', action_description: 'Proses generate kupon dimulai', operator_name: 'Nando', location: 'Surabaya', operator_user_id: 3 }
    ],
    qcValidations: [
        { batch_id: 1, validation_type: 'DISTRIBUTION_CHECK', validation_status: 'PENDING', validation_details: JSON.stringify({ message: 'Menunggu generate kupon' }), validated_by: 'QC Staff', validated_by_user_id: 4 },
        { batch_id: 1, validation_type: 'BOX_COMPOSITION', validation_status: 'PENDING', validation_details: JSON.stringify({ message: 'Menunggu generate kupon' }), validated_by: 'QC Staff', validated_by_user_id: 4 },
        { batch_id: 1, validation_type: 'CONSECUTIVE_CHECK', validation_status: 'PENDING', validation_details: JSON.stringify({ message: 'Menunggu generate kupon' }), validated_by: 'QC Staff', validated_by_user_id: 4 },
        { batch_id: 2, validation_type: 'DISTRIBUTION_CHECK', validation_status: 'PENDING', validation_details: JSON.stringify({ message: 'Menunggu generate kupon' }), validated_by: 'QC Staff', validated_by_user_id: 4 },
        { batch_id: 2, validation_type: 'BOX_COMPOSITION', validation_status: 'PENDING', validation_details: JSON.stringify({ message: 'Menunggu generate kupon' }), validated_by: 'QC Staff', validated_by_user_id: 4 },
        { batch_id: 2, validation_type: 'CONSECUTIVE_CHECK', validation_status: 'PENDING', validation_details: JSON.stringify({ message: 'Menunggu generate kupon' }), validated_by: 'QC Staff', validated_by_user_id: 4 }
    ]
};

// Fungsi untuk insert data
function insertUsers(callback) {
    console.log('Inserting users...');
    let completed = 0;
    const total = dummyData.users.length;
    
    dummyData.users.forEach((user, index) => {
        const query = 'INSERT INTO users (username, email, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)';
        config.query(query, [user.username, user.email, user.full_name, user.role, user.is_active], (error, results) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`User ${user.username} sudah ada, skip...`);
                } else {
                    console.error(`Error inserting user ${user.username}:`, error.message);
                }
            } else {
                console.log(`✓ User ${user.username} inserted (ID: ${results.insertId})`);
            }
            completed++;
            if (completed === total) {
                callback();
            }
        });
    });
}

function insertPrizeConfig(callback) {
    console.log('\nInserting prize config...');
    
    // Nonaktifkan semua prize config yang lama terlebih dahulu
    config.query('UPDATE prize_config SET is_active = 0', (updateError) => {
        if (updateError) {
            console.error('Error deactivating old prize configs:', updateError.message);
        } else {
            console.log('✓ Old prize configs deactivated');
        }
        
        // Insert prize config baru
        let completed = 0;
        const total = dummyData.prizeConfig.length;
        
        dummyData.prizeConfig.forEach((prize, index) => {
            // Gunakan INSERT ... ON DUPLICATE KEY UPDATE untuk update jika sudah ada
            const query = `INSERT INTO prize_config (prize_amount, total_coupons, coupons_per_box, is_active, created_by) 
                          VALUES (?, ?, ?, ?, ?)
                          ON DUPLICATE KEY UPDATE 
                          total_coupons = VALUES(total_coupons),
                          coupons_per_box = VALUES(coupons_per_box),
                          is_active = VALUES(is_active)`;
            config.query(query, [prize.prize_amount, prize.total_coupons, prize.coupons_per_box, prize.is_active, 1], (error, results) => {
                if (error) {
                    console.error(`Error inserting prize config ${prize.prize_amount}:`, error.message);
                } else {
                    if (results.affectedRows === 1) {
                        console.log(`✓ Prize config ${prize.prize_amount} inserted (ID: ${results.insertId})`);
                    } else {
                        console.log(`✓ Prize config ${prize.prize_amount} updated`);
                    }
                }
                completed++;
                if (completed === total) {
                    callback();
                }
            });
        });
    });
}

function insertBatches(callback) {
    console.log('\nInserting batches...');
    let completed = 0;
    const total = dummyData.batches.length;
    
    dummyData.batches.forEach((batch, index) => {
        // Cek dulu apakah batch sudah ada
        config.query('SELECT batch_id FROM batches WHERE batch_number = ?', [batch.batch_number], (checkError, checkResults) => {
            if (checkError) {
                console.error(`Error checking batch ${batch.batch_number}:`, checkError.message);
                completed++;
                if (completed === total) {
                    callback();
                }
                return;
            }
            
            if (checkResults.length > 0) {
                // Update batch yang sudah ada
                const batchId = checkResults[0].batch_id;
                const updateQuery = 'UPDATE batches SET operator_name = ?, location = ?, production_date = ?, total_boxes = ?, status = ?, created_by = ?, operator_id = ? WHERE batch_id = ?';
                config.query(updateQuery, [
                    batch.operator_name,
                    batch.location,
                    batch.production_date,
                    batch.total_boxes,
                    batch.status,
                    batch.created_by,
                    batch.operator_id,
                    batchId
                ], (updateError, updateResults) => {
                    if (updateError) {
                        console.error(`Error updating batch ${batch.batch_number}:`, updateError.message);
                    } else {
                        console.log(`✓ Batch ${batch.batch_number} updated (ID: ${batchId})`);
                    }
                    completed++;
                    if (completed === total) {
                        callback();
                    }
                });
            } else {
                // Insert batch baru
                const insertQuery = 'INSERT INTO batches (batch_number, operator_name, location, production_date, total_boxes, status, created_by, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                config.query(insertQuery, [
                    batch.batch_number,
                    batch.operator_name,
                    batch.location,
                    batch.production_date,
                    batch.total_boxes,
                    batch.status,
                    batch.created_by,
                    batch.operator_id
                ], (insertError, insertResults) => {
                    if (insertError) {
                        console.error(`Error inserting batch ${batch.batch_number}:`, insertError.message);
                    } else {
                        console.log(`✓ Batch ${batch.batch_number} inserted (ID: ${insertResults.insertId})`);
                    }
                    completed++;
                    if (completed === total) {
                        callback();
                    }
                });
            }
        });
    });
}

function insertProductionLogs(callback) {
    console.log('\nInserting production logs...');
    let completed = 0;
    const total = dummyData.productionLogs.length;
    
    dummyData.productionLogs.forEach((log, index) => {
        const query = 'INSERT INTO production_logs (batch_id, action_type, action_description, operator_name, location, operator_user_id) VALUES (?, ?, ?, ?, ?, ?)';
        config.query(query, [
            log.batch_id,
            log.action_type,
            log.action_description,
            log.operator_name,
            log.location,
            log.operator_user_id
        ], (error, results) => {
            if (error) {
                console.error(`Error inserting production log:`, error.message);
            } else {
                console.log(`✓ Production log inserted (ID: ${results.insertId})`);
            }
            completed++;
            if (completed === total) {
                callback();
            }
        });
    });
}

function insertQcValidations(callback) {
    console.log('\nInserting QC validations...');
    let completed = 0;
    const total = dummyData.qcValidations.length;
    
    dummyData.qcValidations.forEach((qc, index) => {
        const query = 'INSERT INTO qc_validations (batch_id, validation_type, validation_status, validation_details, validated_by, validated_by_user_id) VALUES (?, ?, ?, ?, ?, ?)';
        config.query(query, [
            qc.batch_id,
            qc.validation_type,
            qc.validation_status,
            qc.validation_details,
            qc.validated_by,
            qc.validated_by_user_id
        ], (error, results) => {
            if (error) {
                console.error(`Error inserting QC validation:`, error.message);
            } else {
                console.log(`✓ QC validation inserted (ID: ${results.insertId})`);
            }
            completed++;
            if (completed === total) {
                callback();
            }
        });
    });
}

// Fungsi untuk insert kupon dengan batch insert per 1000 (untuk performa)
async function insertCoupons(batchId, generatedBy, forceInsert, callback) {
    console.log(`\nGenerating and inserting coupons for batch ${batchId}...`);
    
    try {
        // Cek apakah kupon sudah ada untuk batch ini
        config.query('SELECT COUNT(*) as count FROM coupons WHERE batch_id = ?', [batchId], async (checkError, checkResults) => {
            if (checkError) {
                console.error(`Error checking coupons for batch ${batchId}:`, checkError.message);
                callback(checkError);
                return;
            }
            
            if (checkResults[0].count > 0) {
                if (forceInsert) {
                    console.log(`⚠ Kupon untuk batch ${batchId} sudah ada (${checkResults[0].count} kupon), menghapus dulu...`);
                    // Hapus semua kupon untuk batch ini
                    config.query('DELETE FROM coupons WHERE batch_id = ?', [batchId], (deleteError, deleteResults) => {
                        if (deleteError) {
                            console.error(`Error deleting coupons for batch ${batchId}:`, deleteError.message);
                            callback(deleteError);
                            return;
                        }
                        console.log(`✓ ${deleteResults.affectedRows} kupon lama dihapus, melanjutkan insert...`);
                        // Tunggu sebentar untuk memastikan delete selesai
                        setTimeout(() => {
                            proceedWithInsert();
                        }, 100);
                    });
                } else {
                    console.log(`⚠ Kupon untuk batch ${batchId} sudah ada (${checkResults[0].count} kupon), skip...`);
                    callback();
                    return;
                }
            } else {
                // Tidak ada kupon, langsung insert
                proceedWithInsert();
            }
            
            async function proceedWithInsert() {
                try {
                    // Ambil batch_number dari database berdasarkan batch_id
                    config.query('SELECT batch_number FROM batches WHERE batch_id = ?', [batchId], async (batchError, batchResults) => {
                        if (batchError) {
                            console.error(`Error getting batch number:`, batchError.message);
                            callback(batchError);
                            return;
                        }
                        
                        if (batchResults.length === 0) {
                            console.error(`Batch dengan ID ${batchId} tidak ditemukan`);
                            callback(new Error(`Batch dengan ID ${batchId} tidak ditemukan`));
                            return;
                        }
                        
                        const batchNumber = batchResults[0].batch_number;
                        
                        // Ambil konfigurasi hadiah dari database
                        const prizeConfig = await getPrizeConfig(config);
                        
                        // Debug: tampilkan prize config yang diambil
                        const totalPrizes = Object.values(prizeConfig).reduce((sum, val) => sum + val, 0);
                        console.log(`  → Prize config loaded: ${totalPrizes} total prize coupons`);
                        console.log(`  → Prize details:`, prizeConfig);
                        
                        // Validasi: harus ada 1900 total prize coupons
                        if (totalPrizes !== 1900) {
                            console.error(`⚠ ERROR: Expected 1900 prize coupons but got ${totalPrizes}`);
                            console.error(`  → This will result in wrong total coupons`);
                            console.error(`  → Please check prize_config table - there might be inactive configs or wrong values`);
                        }
                        
                        // Generate kupon untuk batch ini (5.000 kupon per batch)
                        // Batch 1: box 1-5, nomor 00001-05000
                        // Batch 2: box 6-10, nomor 05001-10000
                        const coupons = generateCouponsForBatch(batchNumber, prizeConfig);
                        console.log(`✓ Generated ${coupons.length} coupons for batch ${batchNumber} (batch_id: ${batchId})`);
                        
                        if (coupons.length !== 5000) {
                            console.warn(`⚠ WARNING: Expected 5000 coupons but got ${coupons.length}`);
                        }
                        
                        // Validasi nomor kupon
                        if (batchNumber === 1) {
                            const firstCoupon = coupons[0].coupon_number;
                            const lastCoupon = coupons[coupons.length - 1].coupon_number;
                            console.log(`  → Coupon range: ${firstCoupon} - ${lastCoupon} (should be 00001 - 05000)`);
                        } else if (batchNumber === 2) {
                            const firstCoupon = coupons[0].coupon_number;
                            const lastCoupon = coupons[coupons.length - 1].coupon_number;
                            console.log(`  → Coupon range: ${firstCoupon} - ${lastCoupon} (should be 05001 - 10000)`);
                        }
                        
                        // Insert per 500 kupon untuk performa
                        const batchSize = 500;
                        let currentIndex = 0;
                        let totalInserted = 0;
                        
                        function insertBatch() {
                            if (currentIndex >= coupons.length) {
                                console.log(`✓ All ${totalInserted} coupons inserted for batch ${batchId}`);
                                callback();
                                return;
                            }
                            
                            const batch = coupons.slice(currentIndex, currentIndex + batchSize);
                            const values = batch.map(coupon => [
                                coupon.coupon_number,
                                coupon.prize_amount,
                                coupon.prize_description,
                                coupon.box_number,
                                batchId,
                                coupon.is_winner ? 1 : 0,
                                generatedBy
                            ]);
                            
                            const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
                            const query = `
                                INSERT INTO coupons (coupon_number, prize_amount, prize_description, 
                                                   box_number, batch_id, is_winner, generated_by)
                                VALUES ${placeholders}
                            `;
                            
                            const flatValues = values.flat();
                            config.query(query, flatValues, (error, results) => {
                                if (error) {
                                    if (error.code === 'ER_DUP_ENTRY') {
                                        // Jika ada duplicate, hapus kupon dengan nomor yang sama dari batch lain
                                        console.warn(`⚠ Duplicate entry detected, cleaning up...`);
                                        const duplicateCoupons = batch.map(c => c.coupon_number);
                                        const deleteQuery = `DELETE FROM coupons WHERE coupon_number IN (${duplicateCoupons.map(() => '?').join(',')}) AND batch_id != ?`;
                                        config.query(deleteQuery, [...duplicateCoupons, batchId], (deleteError) => {
                                            if (deleteError) {
                                                console.error(`Error cleaning duplicates:`, deleteError.message);
                                                callback(deleteError);
                                                return;
                                            }
                                            // Retry insert
                                            config.query(query, flatValues, (retryError) => {
                                                if (retryError) {
                                                    console.error(`Error inserting coupon batch ${Math.floor(currentIndex / batchSize) + 1} after cleanup:`, retryError.message);
                                                    callback(retryError);
                                                    return;
                                                }
                                                totalInserted += batch.length;
                                                const progress = ((currentIndex + batch.length) / coupons.length * 100).toFixed(1);
                                                console.log(`  → Inserted ${totalInserted}/${coupons.length} coupons (${progress}%)`);
                                                currentIndex += batchSize;
                                                setTimeout(insertBatch, 10);
                                            });
                                        });
                                        return;
                                    }
                                    console.error(`Error inserting coupon batch ${Math.floor(currentIndex / batchSize) + 1}:`, error.message);
                                    callback(error);
                                    return;
                                }
                                
                                totalInserted += batch.length;
                                const progress = ((currentIndex + batch.length) / coupons.length * 100).toFixed(1);
                                console.log(`  → Inserted ${totalInserted}/${coupons.length} coupons (${progress}%)`);
                                
                                currentIndex += batchSize;
                                // Insert batch berikutnya dengan sedikit delay untuk tidak overload database
                                setTimeout(insertBatch, 10);
                            });
                        }
                        
                        // Mulai insert
                        insertBatch();
                    });
                } catch (error) {
                    console.error(`Error generating/inserting coupons for batch ${batchId}:`, error.message);
                    callback(error);
                }
            }
        });
    } catch (error) {
        console.error(`Error checking coupons for batch ${batchId}:`, error.message);
        callback(error);
    }
}

// Main execution
console.log('========================================');
console.log('INSERT DUMMY DATA - SOAL TEST INTERVIEW');
console.log('========================================\n');

insertUsers(() => {
    insertPrizeConfig(() => {
        insertBatches(() => {
            insertProductionLogs(() => {
                insertQcValidations(() => {
                    // Insert kupon untuk batch 1 (forceInsert = true untuk test)
                    const forceInsert = process.argv.includes('--force') || process.argv.includes('-f');
                    insertCoupons(1, 1, forceInsert, (error) => {
                        if (error) {
                            console.error('Error inserting coupons for batch 1:', error);
                            process.exit(1);
                        }
                        
                        // Update status batch 1
                        config.query('UPDATE batches SET status = ? WHERE batch_id = ?', ['completed', 1], (err) => {
                            if (err) console.error('Error updating batch 1 status:', err);
                            
                            // Insert kupon untuk batch 2
                            insertCoupons(2, 1, forceInsert, (error) => {
                                if (error) {
                                    console.error('Error inserting coupons for batch 2:', error);
                                    process.exit(1);
                                }
                                
                                // Update status batch 2
                                config.query('UPDATE batches SET status = ? WHERE batch_id = ?', ['completed', 2], (err) => {
                                    if (err) console.error('Error updating batch 2 status:', err);
                                    
                                    console.log('\n========================================');
                                    console.log('✓ Semua dummy data berhasil di-insert!');
                                    console.log('========================================');
                                    console.log('\nData yang di-insert:');
                                    console.log('- 4 Users');
                                    console.log('- 5 Prize Config');
                                    console.log('- 2 Batches');
                                    console.log('- 4 Production Logs');
                                    console.log('- 6 QC Validations');
                                    console.log('- 10.000 Coupons (5.000 per batch)');
                                    console.log('\n✓ Batch 1: Status = completed');
                                    console.log('✓ Batch 2: Status = completed');
                                    process.exit(0);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

