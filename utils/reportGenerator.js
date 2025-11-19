// utils/reportGenerator.js
/**
 * Fungsi untuk generate laporan produksi per batch
 * Format sesuai contoh di soal test
 */

function formatDate(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

async function getProductionReport(batchId, dbConnection) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                b.batch_number,
                b.operator_name,
                b.location,
                b.production_date,
                c.box_number,
                c.coupon_number,
                c.prize_amount,
                c.prize_description
            FROM batches b
            INNER JOIN coupons c ON b.batch_id = c.batch_id
            WHERE b.batch_id = ?
            ORDER BY c.box_number, c.coupon_number
        `;
        
        dbConnection.query(query, [batchId], (error, results) => {
            if (error) {
                return reject(error);
            }
            
            if (results.length === 0) {
                return resolve(null);
            }
            
            // Format data
            const batchInfo = {
                batch_number: results[0].batch_number,
                operator_name: results[0].operator_name,
                location: results[0].location,
                production_date: results[0].production_date,
                coupons: results.map(row => ({
                    box_number: row.box_number,
                    coupon_number: row.coupon_number,
                    prize_amount: parseFloat(row.prize_amount) || 0,
                    prize_description: row.prize_description || ''
                }))
            };
            
            resolve(batchInfo);
        });
    });
}

function formatProductionReport(batchData) {
    const dateStr = formatDate(batchData.production_date);
    const timeStr = formatTime(batchData.production_date);
    
    let report = `No Batch: ${batchData.batch_number}\n`;
    report += `Nama Operator: ${batchData.operator_name}\n`;
    report += `Lokasi: ${batchData.location}\n`;
    report += `Tanggal / Jam: ${dateStr} / ${timeStr}\n\n`;
    report += `No Box | No Kupon | Nominal | Keterangan\n`;
    
    for (const coupon of batchData.coupons) {
        const nominal = coupon.prize_amount > 0 
            ? coupon.prize_amount.toLocaleString('id-ID').replace(/,/g, '.') 
            : '0';
        const keterangan = coupon.prize_amount === 0 ? coupon.prize_description : '';
        report += `${coupon.box_number} | ${coupon.coupon_number} | ${nominal} | ${keterangan}\n`;
    }
    
    return report;
}

module.exports = {
    getProductionReport,
    formatProductionReport
};

