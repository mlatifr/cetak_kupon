/**
 * Validasi box_number sesuai dengan batch_id
 * Batch 1: box_number harus 1-5
 * Batch 2: box_number harus 6-10
 * 
 * @param {number} batch_id - ID batch
 * @param {number} box_number - Nomor box
 * @param {object} dbConnection - Koneksi database
 * @param {function} callback - Callback function (error, isValid, batchNumber)
 */
function validateBoxForBatch(batch_id, box_number, dbConnection, callback) {
    if (!batch_id || box_number === undefined || box_number === null) {
        return callback(null, true, null); // Skip validation jika tidak ada batch_id atau box_number
    }
    
    // Ambil batch_number dari batch_id
    dbConnection.query('SELECT batch_number FROM batches WHERE batch_id = ?', [batch_id], function(error, results) {
        if (error) {
            return callback(error, false, null);
        }
        
        if (results.length === 0) {
            return callback(new Error('Batch tidak ditemukan'), false, null);
        }
        
        const batchNumber = results[0].batch_number;
        const boxNum = parseInt(box_number);
        
        // Validasi box_number sesuai batch_number
        let isValid = false;
        let expectedBoxes = [];
        
        if (batchNumber === 1) {
            isValid = boxNum >= 1 && boxNum <= 5;
            expectedBoxes = [1, 2, 3, 4, 5];
        } else if (batchNumber === 2) {
            isValid = boxNum >= 6 && boxNum <= 10;
            expectedBoxes = [6, 7, 8, 9, 10];
        } else {
            return callback(new Error(`Batch number ${batchNumber} tidak valid`), false, null);
        }
        
        if (!isValid) {
            const error = new Error(`Box ${boxNum} tidak valid untuk Batch ${batchNumber}. Box yang valid untuk Batch ${batchNumber}: ${expectedBoxes.join(', ')}`);
            error.statusCode = 400;
            return callback(error, false, batchNumber);
        }
        
        callback(null, true, batchNumber);
    });
}

/**
 * Validasi box_number sesuai dengan batch_number (tanpa query database)
 * Batch 1: box_number harus 1-5
 * Batch 2: box_number harus 6-10
 * 
 * @param {number} batch_number - Nomor batch (1 atau 2)
 * @param {number} box_number - Nomor box
 * @returns {object} { isValid: boolean, error: string|null }
 */
function validateBoxForBatchNumber(batch_number, box_number) {
    if (box_number === undefined || box_number === null) {
        return { isValid: true, error: null };
    }
    
    const boxNum = parseInt(box_number);
    const batchNum = parseInt(batch_number);
    
    let isValid = false;
    let expectedBoxes = [];
    
    if (batchNum === 1) {
        isValid = boxNum >= 1 && boxNum <= 5;
        expectedBoxes = [1, 2, 3, 4, 5];
    } else if (batchNum === 2) {
        isValid = boxNum >= 6 && boxNum <= 10;
        expectedBoxes = [6, 7, 8, 9, 10];
    } else {
        return {
            isValid: false,
            error: `Batch number ${batchNum} tidak valid. Batch number harus 1 atau 2.`
        };
    }
    
    if (!isValid) {
        return {
            isValid: false,
            error: `Box ${boxNum} tidak valid untuk Batch ${batchNum}. Box yang valid untuk Batch ${batchNum}: ${expectedBoxes.join(', ')}`
        };
    }
    
    return { isValid: true, error: null };
}

module.exports = {
    validateBoxForBatch,
    validateBoxForBatchNumber
};

