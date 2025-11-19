// utils/couponGenerator.js
/**
 * Generate 10.000 kupon sesuai kriteria:
 * - Nomor seri 00001-10000
 * - Distribusi hadiah: 50x100k, 100x50k, 250x20k, 500x10k, 1000x5k
 * - Tidak boleh hadiah sama pada nomor berurutan
 * - Komposisi per box sama (10 box x 1000 kupon)
 */

const TOTAL_BOXES = 10;
const COUPONS_PER_BOX = 1000;

// Fisher-Yates Shuffle
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function eliminateConsecutivePrizes(prizes) {
    const fixedPrizes = [...prizes];
    let maxIterations = 100; // Prevent infinite loop
    let iterations = 0;
    
    while (iterations < maxIterations) {
        let hasConsecutive = false;
        for (let i = 0; i < fixedPrizes.length - 1; i++) {
            if (fixedPrizes[i] === fixedPrizes[i + 1] && fixedPrizes[i] !== 0) {
                hasConsecutive = true;
                // Swap dengan elemen setelahnya yang berbeda
                let swapIdx = i + 2;
                while (swapIdx < fixedPrizes.length && fixedPrizes[swapIdx] === fixedPrizes[i]) {
                    swapIdx++;
                }
                if (swapIdx < fixedPrizes.length) {
                    [fixedPrizes[i + 1], fixedPrizes[swapIdx]] = [fixedPrizes[swapIdx], fixedPrizes[i + 1]];
                } else {
                    // Jika tidak ada elemen berbeda setelahnya, cari dari awal
                    for (let k = 0; k < i; k++) {
                        if (fixedPrizes[k] !== fixedPrizes[i]) {
                            [fixedPrizes[i + 1], fixedPrizes[k]] = [fixedPrizes[k], fixedPrizes[i + 1]];
                            break;
                        }
                    }
                }
            }
        }
        if (!hasConsecutive) break;
        iterations++;
    }
    return fixedPrizes;
}

async function getPrizeConfig(dbConnection) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT prize_amount, total_coupons, coupons_per_box FROM prize_config WHERE is_active = 1 ORDER BY prize_amount DESC';
        dbConnection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                const config = {};
                results.forEach(row => {
                    config[row.prize_amount] = row.total_coupons;
                });
                resolve(config);
            }
        });
    });
}

function generateCoupons(prizeConfig) {
    // Hitung komposisi per box
    const prizePerBox = {};
    for (const [prize, count] of Object.entries(prizeConfig)) {
        prizePerBox[prize] = Math.floor(count / TOTAL_BOXES);
    }
    
    // Generate list hadiah per box (190 berhadiah + 810 tidak beruntung)
    const boxPrizeTemplate = [];
    const sortedPrizes = Object.entries(prizePerBox).sort((a, b) => b[0] - a[0]);
    
    for (const [prize, count] of sortedPrizes) {
        for (let i = 0; i < count; i++) {
            boxPrizeTemplate.push(parseInt(prize));
        }
    }
    
    // Tambahkan 810 kupon tidak beruntung
    for (let i = 0; i < COUPONS_PER_BOX - boxPrizeTemplate.length; i++) {
        boxPrizeTemplate.push(0);
    }
    
    const allCoupons = [];
    
    // Generate untuk setiap box
    for (let boxNum = 1; boxNum <= TOTAL_BOXES; boxNum++) {
        // Copy dan shuffle template
        let boxPrizes = shuffleArray(boxPrizeTemplate);
        
        // Fix consecutive prizes
        boxPrizes = eliminateConsecutivePrizes(boxPrizes);
        
        // Validasi: pastikan masih 1000 kupon setelah eliminateConsecutivePrizes
        if (boxPrizes.length !== COUPONS_PER_BOX) {
            console.warn(`⚠ WARNING: Box ${boxNum} has ${boxPrizes.length} coupons instead of ${COUPONS_PER_BOX}`);
            // Tambahkan kupon tidak beruntung jika kurang
            while (boxPrizes.length < COUPONS_PER_BOX) {
                boxPrizes.push(0);
            }
            // Potong jika lebih
            boxPrizes = boxPrizes.slice(0, COUPONS_PER_BOX);
        }
        
        // Assign nomor kupon
        const startNum = (boxNum - 1) * COUPONS_PER_BOX + 1;
        for (let idx = 0; idx < boxPrizes.length; idx++) {
            const couponNum = startNum + idx;
            allCoupons.push({
                coupon_number: String(couponNum).padStart(5, '0'),
                prize_amount: boxPrizes[idx],
                prize_description: boxPrizes[idx] === 0 ? 'Anda Belum Beruntung' : '',
                box_number: boxNum,
                is_winner: boxPrizes[idx] > 0
            });
        }
    }
    
    return allCoupons;
}

/**
 * Generate kupon untuk batch tertentu
 * Batch 1: box 1-5, nomor 00001-05000 (5.000 kupon)
 * Batch 2: box 6-10, nomor 05001-10000 (5.000 kupon)
 * @param {number} batchNumber - Nomor batch (1 atau 2)
 * @param {object} prizeConfig - Konfigurasi hadiah
 * @returns {array} Array of coupon objects
 */
function generateCouponsForBatch(batchNumber, prizeConfig) {
    const BOXES_PER_BATCH = 5;
    
    // Validasi batch number
    if (batchNumber !== 1 && batchNumber !== 2) {
        throw new Error('Batch number must be 1 or 2');
    }
    
    // Hitung komposisi per box (total hadiah dibagi 10 box, lalu per batch dapat 5 box)
    const prizePerBox = {};
    for (const [prize, count] of Object.entries(prizeConfig)) {
        prizePerBox[prize] = Math.floor(count / TOTAL_BOXES);
    }
    
    // Generate list hadiah per box (190 berhadiah + 810 tidak beruntung)
    const boxPrizeTemplate = [];
    const sortedPrizes = Object.entries(prizePerBox).sort((a, b) => b[0] - a[0]);
    
    for (const [prize, count] of sortedPrizes) {
        for (let i = 0; i < count; i++) {
            boxPrizeTemplate.push(parseInt(prize));
        }
    }
    
    // Tambahkan 810 kupon tidak beruntung
    for (let i = 0; i < COUPONS_PER_BOX - boxPrizeTemplate.length; i++) {
        boxPrizeTemplate.push(0);
    }
    
    const allCoupons = [];
    
    // Tentukan range box untuk batch ini
    const startBox = (batchNumber - 1) * BOXES_PER_BATCH + 1;
    const endBox = batchNumber * BOXES_PER_BATCH;
    
    // Generate untuk setiap box di batch ini
    for (let boxNum = startBox; boxNum <= endBox; boxNum++) {
        // Copy dan shuffle template
        let boxPrizes = shuffleArray(boxPrizeTemplate);
        
        // Fix consecutive prizes
        boxPrizes = eliminateConsecutivePrizes(boxPrizes);
        
        // Validasi: pastikan masih 1000 kupon setelah eliminateConsecutivePrizes
        if (boxPrizes.length !== COUPONS_PER_BOX) {
            console.warn(`⚠ WARNING: Box ${boxNum} has ${boxPrizes.length} coupons instead of ${COUPONS_PER_BOX}`);
            // Tambahkan kupon tidak beruntung jika kurang
            while (boxPrizes.length < COUPONS_PER_BOX) {
                boxPrizes.push(0);
            }
            // Potong jika lebih
            boxPrizes = boxPrizes.slice(0, COUPONS_PER_BOX);
        }
        
        // Assign nomor kupon (nomor global 00001-10000)
        const startNum = (boxNum - 1) * COUPONS_PER_BOX + 1;
        for (let idx = 0; idx < boxPrizes.length; idx++) {
            const couponNum = startNum + idx;
            allCoupons.push({
                coupon_number: String(couponNum).padStart(5, '0'),
                prize_amount: boxPrizes[idx],
                prize_description: boxPrizes[idx] === 0 ? 'Anda Belum Beruntung' : '',
                box_number: boxNum,
                is_winner: boxPrizes[idx] > 0
            });
        }
    }
    
    return allCoupons;
}

// Fungsi untuk save ke database dengan bulk insert (lebih efisien)
async function saveCouponsToDb(coupons, batchId, generatedBy, dbConnection) {
    return new Promise((resolve, reject) => {
        dbConnection.beginTransaction((err) => {
            if (err) {
                return reject(err);
            }
            
            // Bulk insert dengan batch size 500 untuk menghindari query terlalu panjang
            const batchSize = 500;
            let currentIndex = 0;
            
            function insertBatch() {
                if (currentIndex >= coupons.length) {
                    dbConnection.commit((err) => {
                        if (err) {
                            return dbConnection.rollback(() => reject(err));
                        }
                        resolve();
                    });
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
                dbConnection.query(query, flatValues, (error) => {
                    if (error) {
                        return dbConnection.rollback(() => reject(error));
                    }
                    currentIndex += batchSize;
                    insertBatch();
                });
            }
            
            insertBatch();
        });
    });
}

module.exports = {
    generateCoupons,
    generateCouponsForBatch,
    saveCouponsToDb,
    getPrizeConfig
};

