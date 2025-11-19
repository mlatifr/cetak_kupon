// utils/qcValidator.js
/**
 * Fungsi untuk melakukan validasi QC otomatis
 * - DISTRIBUTION_CHECK: Cek distribusi hadiah sesuai konfigurasi
 * - BOX_COMPOSITION: Cek komposisi hadiah per box sama
 * - CONSECUTIVE_CHECK: Cek tidak ada hadiah sama pada nomor berurutan
 */

/**
 * Validasi distribusi hadiah sesuai konfigurasi
 */
async function validateDistribution(batchId, dbConnection) {
    return new Promise((resolve, reject) => {
        // Ambil prize config
        const prizeConfigQuery = 'SELECT prize_amount, total_coupons FROM prize_config WHERE is_active = 1';
        dbConnection.query(prizeConfigQuery, async (error, prizeConfigs) => {
            if (error) {
                return reject(error);
            }

            // Ambil semua kupon untuk batch ini
            const couponsQuery = 'SELECT prize_amount, COUNT(*) as count FROM coupons WHERE batch_id = ? AND prize_amount > 0 GROUP BY prize_amount';
            dbConnection.query(couponsQuery, [batchId], (error, couponResults) => {
                if (error) {
                    return reject(error);
                }

                const actualDistribution = {};
                couponResults.forEach(row => {
                    actualDistribution[row.prize_amount] = row.count;
                });

                const expectedDistribution = {};
                prizeConfigs.forEach(config => {
                    // Untuk batch, distribusi dibagi 2 (karena 2 batch)
                    expectedDistribution[config.prize_amount] = Math.floor(config.total_coupons / 2);
                });

                const issues = [];
                let isValid = true;

                // Cek setiap prize amount
                for (const [prize, expectedCount] of Object.entries(expectedDistribution)) {
                    const actualCount = actualDistribution[prize] || 0;
                    if (actualCount !== expectedCount) {
                        isValid = false;
                        issues.push({
                            prize_amount: prize,
                            expected: expectedCount,
                            actual: actualCount,
                            difference: actualCount - expectedCount
                        });
                    }
                }

                resolve({
                    status: isValid ? 'PASS' : 'FAIL',
                    details: {
                        expected: expectedDistribution,
                        actual: actualDistribution,
                        issues: issues,
                        message: isValid 
                            ? 'Distribusi hadiah sesuai konfigurasi' 
                            : `Distribusi hadiah tidak sesuai: ${issues.length} masalah ditemukan`
                    }
                });
            });
        });
    });
}

/**
 * Validasi komposisi hadiah per box sama
 */
async function validateBoxComposition(batchId, dbConnection) {
    return new Promise((resolve, reject) => {
        // Ambil prize config untuk komposisi per box
        const prizeConfigQuery = 'SELECT prize_amount, coupons_per_box FROM prize_config WHERE is_active = 1 ORDER BY prize_amount DESC';
        dbConnection.query(prizeConfigQuery, (error, prizeConfigs) => {
            if (error) {
                return reject(error);
            }

            // Ambil komposisi hadiah per box untuk batch ini
            const boxCompositionQuery = `
                SELECT box_number, prize_amount, COUNT(*) as count 
                FROM coupons 
                WHERE batch_id = ? AND prize_amount > 0 
                GROUP BY box_number, prize_amount 
                ORDER BY box_number, prize_amount DESC
            `;
            dbConnection.query(boxCompositionQuery, [batchId], (error, boxResults) => {
                if (error) {
                    return reject(error);
                }

                // Buat expected composition per box
                const expectedComposition = {};
                prizeConfigs.forEach(config => {
                    expectedComposition[config.prize_amount] = config.coupons_per_box;
                });

                // Group hasil per box
                const boxCompositions = {};
                boxResults.forEach(row => {
                    if (!boxCompositions[row.box_number]) {
                        boxCompositions[row.box_number] = {};
                    }
                    boxCompositions[row.box_number][row.prize_amount] = row.count;
                });

                const issues = [];
                let isValid = true;

                // Cek setiap box
                for (const [boxNum, composition] of Object.entries(boxCompositions)) {
                    for (const [prize, expectedCount] of Object.entries(expectedComposition)) {
                        const actualCount = composition[prize] || 0;
                        if (actualCount !== expectedCount) {
                            isValid = false;
                            issues.push({
                                box_number: boxNum,
                                prize_amount: prize,
                                expected: expectedCount,
                                actual: actualCount,
                                difference: actualCount - expectedCount
                            });
                        }
                    }
                }

                resolve({
                    status: isValid ? 'PASS' : 'FAIL',
                    details: {
                        expected_per_box: expectedComposition,
                        box_compositions: boxCompositions,
                        issues: issues,
                        message: isValid 
                            ? 'Komposisi hadiah per box sama' 
                            : `Komposisi hadiah per box tidak sama: ${issues.length} masalah ditemukan`
                    }
                });
            });
        });
    });
}

/**
 * Validasi tidak ada hadiah sama pada nomor berurutan
 */
async function validateConsecutive(batchId, dbConnection) {
    return new Promise((resolve, reject) => {
        // Ambil semua kupon untuk batch ini, urutkan berdasarkan nomor kupon
        const couponsQuery = `
            SELECT coupon_number, prize_amount 
            FROM coupons 
            WHERE batch_id = ? 
            ORDER BY coupon_number ASC
        `;
        dbConnection.query(couponsQuery, [batchId], (error, coupons) => {
            if (error) {
                return reject(error);
            }

            const consecutiveIssues = [];
            
            // Cek setiap pasangan kupon berurutan
            for (let i = 0; i < coupons.length - 1; i++) {
                const current = coupons[i];
                const next = coupons[i + 1];
                
                // Cek jika hadiah sama dan bukan 0 (tidak beruntung)
                if (current.prize_amount === next.prize_amount && current.prize_amount > 0) {
                    consecutiveIssues.push({
                        coupon_number_1: current.coupon_number,
                        coupon_number_2: next.coupon_number,
                        prize_amount: current.prize_amount
                    });
                }
            }

            const isValid = consecutiveIssues.length === 0;

            resolve({
                status: isValid ? 'PASS' : 'FAIL',
                details: {
                    total_consecutive_issues: consecutiveIssues.length,
                    issues: consecutiveIssues.slice(0, 10), // Limit untuk tidak terlalu panjang
                    message: isValid 
                        ? 'Tidak ada hadiah sama pada nomor berurutan' 
                        : `Ditemukan ${consecutiveIssues.length} pasangan kupon berurutan dengan hadiah sama`
                }
            });
        });
    });
}

/**
 * Jalankan semua validasi QC untuk batch tertentu
 */
async function runQCValidation(batchId, dbConnection) {
    const results = {
        batch_id: batchId,
        validations: {}
    };

    try {
        // DISTRIBUTION_CHECK
        results.validations.DISTRIBUTION_CHECK = await validateDistribution(batchId, dbConnection);
        
        // BOX_COMPOSITION
        results.validations.BOX_COMPOSITION = await validateBoxComposition(batchId, dbConnection);
        
        // CONSECUTIVE_CHECK
        results.validations.CONSECUTIVE_CHECK = await validateConsecutive(batchId, dbConnection);

        // Update QC validations di database
        for (const [validationType, validationResult] of Object.entries(results.validations)) {
            const updateQuery = `
                UPDATE qc_validations 
                SET validation_status = ?, 
                    validation_details = ?,
                    validated_at = NOW()
                WHERE batch_id = ? AND validation_type = ?
            `;
            
            await new Promise((resolve, reject) => {
                dbConnection.query(updateQuery, [
                    validationResult.status,
                    JSON.stringify(validationResult.details),
                    batchId,
                    validationType
                ], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        return results;
    } catch (error) {
        throw error;
    }
}

/**
 * Format validation_details dari JSON menjadi teks yang mudah dibaca
 */
function formatValidationDescription(validationType, validationDetails) {
    if (!validationDetails) {
        return 'Tidak ada detail validasi';
    }

    // Parse JSON jika masih string
    let details;
    try {
        details = typeof validationDetails === 'string' 
            ? JSON.parse(validationDetails) 
            : validationDetails;
    } catch (e) {
        return validationDetails; // Return as-is jika bukan JSON
    }

    // Format berdasarkan tipe validasi
    switch (validationType) {
        case 'DISTRIBUTION_CHECK':
            if (details.message) {
                let desc = details.message;
                
                const prizeLabels = {
                    '100000': 'Rp 100.000',
                    '50000': 'Rp 50.000',
                    '20000': 'Rp 20.000',
                    '10000': 'Rp 10.000',
                    '5000': 'Rp 5.000'
                };

                if (details.expected && details.actual) {
                    desc += '\n\nRincian:\n';
                    const sortedPrizes = Object.keys(details.expected).sort((a, b) => b - a);
                    sortedPrizes.forEach(prize => {
                        const label = prizeLabels[prize] || `Rp ${parseInt(prize).toLocaleString('id-ID')}`;
                        const expected = details.expected[prize] || 0;
                        const actual = details.actual[prize] || 0;
                        const status = expected === actual ? '✓' : '✗';
                        desc += `${label}: ${actual} kupon (harusnya ${expected}) ${status}\n`;
                    });
                }

                if (details.issues && details.issues.length > 0) {
                    desc += '\n⚠ Masalah:\n';
                    details.issues.forEach((issue, idx) => {
                        desc += `${idx + 1}. ${prizeLabels[issue.prize_amount] || issue.prize_amount}: `;
                        desc += `Aktual ${issue.actual}, harusnya ${issue.expected} (selisih ${issue.difference > 0 ? '+' : ''}${issue.difference})\n`;
                    });
                }

                return desc;
            }
            return details.message || 'Distribusi hadiah dicek';

        case 'BOX_COMPOSITION':
            if (details.message) {
                let desc = details.message;
                
                if (details.expected_per_box) {
                    desc += '\n\nStandar per box:\n';
                    const prizeLabels = {
                        '100000': 'Rp 100.000',
                        '50000': 'Rp 50.000',
                        '20000': 'Rp 20.000',
                        '10000': 'Rp 10.000',
                        '5000': 'Rp 5.000'
                    };

                    const sortedPrizes = Object.keys(details.expected_per_box).sort((a, b) => b - a);
                    sortedPrizes.forEach(prize => {
                        const label = prizeLabels[prize] || `Rp ${parseInt(prize).toLocaleString('id-ID')}`;
                        const count = details.expected_per_box[prize];
                        desc += `${label}: ${count} kupon\n`;
                    });

                    if (details.box_compositions) {
                        desc += '\nStatus per box:\n';
                        const boxNumbers = Object.keys(details.box_compositions).sort((a, b) => a - b);
                        let allValid = true;
                        boxNumbers.forEach(boxNum => {
                            const boxStatus = [];
                            sortedPrizes.forEach(prize => {
                                const count = details.box_compositions[boxNum][prize] || 0;
                                const expected = details.expected_per_box[prize];
                                boxStatus.push(count === expected);
                            });
                            const isValid = boxStatus.every(s => s === true);
                            if (!isValid) allValid = false;
                            desc += `Box ${boxNum}: ${isValid ? 'Sesuai ✓' : 'Tidak sesuai ✗'}\n`;
                        });
                    }

                    if (details.issues && details.issues.length > 0) {
                        desc += '\n⚠ Masalah:\n';
                        details.issues.forEach((issue, idx) => {
                            desc += `${idx + 1}. Box ${issue.box_number}, ${prizeLabels[issue.prize_amount] || issue.prize_amount}: `;
                            desc += `Aktual ${issue.actual}, harusnya ${issue.expected}\n`;
                        });
                    }
                }

                return desc;
            }
            return details.message || 'Komposisi per box dicek';

        case 'CONSECUTIVE_CHECK':
            if (details.message) {
                let desc = details.message;
                
                if (details.total_consecutive_issues !== undefined && details.total_consecutive_issues > 0) {
                    desc += `\n\nDitemukan ${details.total_consecutive_issues} pasangan kupon dengan hadiah sama berurutan.`;
                }

                if (details.issues && details.issues.length > 0) {
                    desc += '\n\nContoh masalah:\n';
                    details.issues.slice(0, 5).forEach((issue, idx) => {
                        desc += `${idx + 1}. Kupon ${issue.coupon_number_1} & ${issue.coupon_number_2}: `;
                        desc += `Rp ${parseInt(issue.prize_amount).toLocaleString('id-ID')}\n`;
                    });
                    if (details.issues.length > 5) {
                        desc += `... dan ${details.issues.length - 5} masalah lainnya`;
                    }
                }

                return desc;
            }
            return details.message || 'Cek kupon berurutan';

        default:
            return details.message || JSON.stringify(details, null, 2);
    }
}

module.exports = {
    validateDistribution,
    validateBoxComposition,
    validateConsecutive,
    runQCValidation,
    formatValidationDescription
};

