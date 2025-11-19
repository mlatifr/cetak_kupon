/**
 * SCRIPT TEST OTOMATIS BACKEND API
 * Menguji semua API dan validasi data sesuai kunci jawaban soal test interview
 * 
 * Cara menjalankan:
 * node scripts/testBackend.js
 */

const http = require('http');
const mysql = require('mysql');
const config = require('../config');

// Konfigurasi API
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
    users: '/api/users',
    prizeConfig: '/api/prize-config',
    coupons: '/api/coupons',
    batches: '/api/batches',
    qcValidations: '/api/qc-validations',
    productionLogs: '/api/production-logs'
};

// Warna untuk output console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test results
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    errors: []
};

// Helper function untuk HTTP request
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({
                        status: res.statusCode,
                        data: parsed,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Helper function untuk query database
function queryDb(query, params = []) {
    return new Promise((resolve, reject) => {
        config.query(query, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// Test function wrapper
function test(name, testFn) {
    testResults.total++;
    process.stdout.write(`\n${colors.cyan}[TEST]${colors.reset} ${name}... `);
    
    return testFn()
        .then(() => {
            testResults.passed++;
            console.log(`${colors.green}✓ PASSED${colors.reset}`);
        })
        .catch((error) => {
            testResults.failed++;
            testResults.errors.push({ name, error: error.message });
            console.log(`${colors.red}✗ FAILED${colors.reset}`);
            console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
        });
}

// ============================================================================
// TEST SUITE 1: VALIDASI DATA DI DATABASE
// ============================================================================

async function testDatabaseStructure() {
    await test('Database connection', async () => {
        const result = await queryDb('SELECT 1 as test');
        if (!result || result.length === 0) {
            throw new Error('Database connection failed');
        }
    });

    await test('Tabel prize_config memiliki 5 konfigurasi aktif', async () => {
        const result = await queryDb('SELECT * FROM prize_config WHERE is_active = 1');
        if (result.length !== 5) {
            throw new Error(`Expected 5 prize configs, found ${result.length}`);
        }
        
        // Validasi nilai sesuai soal
        const expected = {
            100000: 50,
            50000: 100,
            20000: 250,
            10000: 500,
            5000: 1000
        };
        
        const actual = {};
        result.forEach(row => {
            actual[row.prize_amount] = row.total_coupons;
        });
        
        for (const [prize, count] of Object.entries(expected)) {
            if (actual[prize] !== count) {
                throw new Error(`Prize ${prize}: expected ${count}, found ${actual[prize] || 0}`);
            }
        }
    });

    await test('Tabel batches memiliki 2 batch', async () => {
        const result = await queryDb('SELECT * FROM batches ORDER BY batch_number');
        if (result.length !== 2) {
            throw new Error(`Expected 2 batches, found ${result.length}`);
        }
        
        // Validasi batch 1
        if (result[0].batch_number !== 1 || result[0].operator_name !== 'Amir') {
            throw new Error('Batch 1 tidak sesuai');
        }
        
        // Validasi batch 2
        if (result[1].batch_number !== 2 || result[1].operator_name !== 'Nando') {
            throw new Error('Batch 2 tidak sesuai');
        }
    });
}

// ============================================================================
// TEST SUITE 2: API ENDPOINTS
// ============================================================================

async function testAPIEndpoints() {
    await test('GET /api/prize-config - List semua konfigurasi hadiah', async () => {
        const response = await makeRequest('GET', API_ENDPOINTS.prizeConfig);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!Array.isArray(response.data) || response.data.length === 0) {
            throw new Error('Response should be an array with data');
        }
    });

    await test('GET /api/batches - List semua batch', async () => {
        const response = await makeRequest('GET', API_ENDPOINTS.batches);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!Array.isArray(response.data)) {
            throw new Error('Response should be an array');
        }
    });

    await test('GET /api/batches/1 - Get batch by batch_number', async () => {
        const response = await makeRequest('GET', `${API_ENDPOINTS.batches}/1`);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (response.data.batch_number !== 1) {
            throw new Error('Batch number should be 1');
        }
    });

    await test('GET /api/coupons - List semua kupon', async () => {
        const response = await makeRequest('GET', API_ENDPOINTS.coupons);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!Array.isArray(response.data)) {
            throw new Error('Response should be an array');
        }
    });
}

// ============================================================================
// TEST SUITE 3: GENERATE KUPON
// ============================================================================

async function testGenerateCoupons() {
    // Cek apakah kupon sudah ada
    const existingCoupons = await queryDb('SELECT COUNT(*) as count FROM coupons');
    const hasCoupons = existingCoupons[0].count > 0;

    if (!hasCoupons) {
        await test('POST /api/coupons/generate - Generate kupon untuk batch 1', async () => {
            const response = await makeRequest('POST', `${API_ENDPOINTS.coupons}/generate`, {
                batch_id: 1,
                generated_by: 1
            });
            
            if (response.status !== 201) {
                throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
            }
            
            if (!response.data.success) {
                throw new Error('Generate should be successful');
            }
            
            if (response.data.totalCoupons !== 5000) {
                throw new Error(`Expected 5000 coupons, got ${response.data.totalCoupons}`);
            }
        });

        await test('POST /api/coupons/generate - Generate kupon untuk batch 2', async () => {
            const response = await makeRequest('POST', `${API_ENDPOINTS.coupons}/generate`, {
                batch_id: 2,
                generated_by: 1
            });
            
            if (response.status !== 201) {
                throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
            }
            
            if (!response.data.success) {
                throw new Error('Generate should be successful');
            }
            
            if (response.data.totalCoupons !== 5000) {
                throw new Error(`Expected 5000 coupons, got ${response.data.totalCoupons}`);
            }
        });
    } else {
        console.log(`\n${colors.yellow}[SKIP]${colors.reset} Kupon sudah ada di database, skip generate`);
    }
}

// ============================================================================
// TEST SUITE 4: VALIDASI DATA KUPON
// ============================================================================

async function testCouponData() {
    await test('Total kupon = 10.000 (00001-10000)', async () => {
        const result = await queryDb('SELECT COUNT(*) as count FROM coupons');
        const total = result[0].count;
        
        if (total !== 10000) {
            throw new Error(`Expected 10000 coupons, found ${total}`);
        }
        
        // Cek range nomor kupon
        const minMax = await queryDb('SELECT MIN(coupon_number) as min, MAX(coupon_number) as max FROM coupons');
        if (minMax[0].min !== '00001' || minMax[0].max !== '10000') {
            throw new Error(`Coupon number range should be 00001-10000, found ${minMax[0].min}-${minMax[0].max}`);
        }
    });

    await test('Total hadiah = Rp 25.000.000', async () => {
        const result = await queryDb('SELECT SUM(prize_amount) as total FROM coupons WHERE prize_amount > 0');
        const total = parseFloat(result[0].total);
        const expected = 25000000;
        
        if (Math.abs(total - expected) > 0.01) {
            throw new Error(`Expected total prize Rp ${expected.toLocaleString('id-ID')}, found Rp ${total.toLocaleString('id-ID')}`);
        }
    });

    await test('Distribusi hadiah sesuai konfigurasi (50x100k, 100x50k, 250x20k, 500x10k, 1000x5k)', async () => {
        const expected = {
            100000: 50,
            50000: 100,
            20000: 250,
            10000: 500,
            5000: 1000
        };
        
        const result = await queryDb(`
            SELECT prize_amount, COUNT(*) as count 
            FROM coupons 
            WHERE prize_amount > 0 
            GROUP BY prize_amount
        `);
        
        const actual = {};
        result.forEach(row => {
            actual[row.prize_amount] = row.count;
        });
        
        for (const [prize, count] of Object.entries(expected)) {
            if (actual[prize] !== count) {
                throw new Error(`Prize ${prize}: expected ${count}, found ${actual[prize] || 0}`);
            }
        }
    });

    await test('Total kupon berhadiah = 1.900', async () => {
        const result = await queryDb('SELECT COUNT(*) as count FROM coupons WHERE prize_amount > 0');
        const total = result[0].count;
        
        if (total !== 1900) {
            throw new Error(`Expected 1900 winning coupons, found ${total}`);
        }
    });

    await test('Total kupon tidak beruntung = 8.100', async () => {
        const result = await queryDb('SELECT COUNT(*) as count FROM coupons WHERE prize_amount = 0');
        const total = result[0].count;
        
        if (total !== 8100) {
            throw new Error(`Expected 8100 non-winning coupons, found ${total}`);
        }
    });

    await test('Setiap box memiliki 1.000 kupon', async () => {
        const result = await queryDb(`
            SELECT box_number, COUNT(*) as count 
            FROM coupons 
            GROUP BY box_number 
            ORDER BY box_number
        `);
        
        if (result.length !== 10) {
            throw new Error(`Expected 10 boxes, found ${result.length}`);
        }
        
        for (const row of result) {
            if (row.count !== 1000) {
                throw new Error(`Box ${row.box_number}: expected 1000 coupons, found ${row.count}`);
            }
        }
    });

    await test('Komposisi hadiah per box sama (5x100k, 10x50k, 25x20k, 50x10k, 100x5k per box)', async () => {
        const expectedPerBox = {
            100000: 5,
            50000: 10,
            20000: 25,
            10000: 50,
            5000: 100
        };
        
        for (let boxNum = 1; boxNum <= 10; boxNum++) {
            const result = await queryDb(`
                SELECT prize_amount, COUNT(*) as count 
                FROM coupons 
                WHERE box_number = ? AND prize_amount > 0
                GROUP BY prize_amount
            `, [boxNum]);
            
            const actual = {};
            result.forEach(row => {
                actual[row.prize_amount] = row.count;
            });
            
            for (const [prize, count] of Object.entries(expectedPerBox)) {
                if (actual[prize] !== count) {
                    throw new Error(`Box ${boxNum}, Prize ${prize}: expected ${count}, found ${actual[prize] || 0}`);
                }
            }
        }
    });

    await test('Tidak ada hadiah sama pada nomor kupon berurutan', async () => {
        const result = await queryDb(`
            SELECT c1.coupon_number as num1, c2.coupon_number as num2, c1.prize_amount
            FROM coupons c1
            INNER JOIN coupons c2 ON CAST(c2.coupon_number AS UNSIGNED) = CAST(c1.coupon_number AS UNSIGNED) + 1
            WHERE c1.prize_amount = c2.prize_amount 
            AND c1.prize_amount > 0
            ORDER BY c1.coupon_number
            LIMIT 10
        `);
        
        if (result.length > 0) {
            const examples = result.slice(0, 3).map(r => `${r.num1}-${r.num2} (Rp ${r.prize_amount})`).join(', ');
            throw new Error(`Found ${result.length} consecutive coupons with same prize. Examples: ${examples}`);
        }
    });

    await test('Batch 1 memiliki 5.000 kupon (box 1-5)', async () => {
        const result = await queryDb('SELECT COUNT(*) as count FROM coupons WHERE batch_id = 1');
        const total = result[0].count;
        
        if (total !== 5000) {
            throw new Error(`Batch 1: expected 5000 coupons, found ${total}`);
        }
        
        // Cek box range
        const boxRange = await queryDb(`
            SELECT MIN(box_number) as min_box, MAX(box_number) as max_box 
            FROM coupons 
            WHERE batch_id = 1
        `);
        
        if (boxRange[0].min_box !== 1 || boxRange[0].max_box !== 5) {
            throw new Error(`Batch 1: expected boxes 1-5, found ${boxRange[0].min_box}-${boxRange[0].max_box}`);
        }
    });

    await test('Batch 2 memiliki 5.000 kupon (box 6-10)', async () => {
        const result = await queryDb('SELECT COUNT(*) as count FROM coupons WHERE batch_id = 2');
        const total = result[0].count;
        
        if (total !== 5000) {
            throw new Error(`Batch 2: expected 5000 coupons, found ${total}`);
        }
        
        // Cek box range
        const boxRange = await queryDb(`
            SELECT MIN(box_number) as min_box, MAX(box_number) as max_box 
            FROM coupons 
            WHERE batch_id = 2
        `);
        
        if (boxRange[0].min_box !== 6 || boxRange[0].max_box !== 10) {
            throw new Error(`Batch 2: expected boxes 6-10, found ${boxRange[0].min_box}-${boxRange[0].max_box}`);
        }
    });
}

// ============================================================================
// TEST SUITE 5: QC VALIDATION
// ============================================================================

async function testQCValidation() {
    await test('POST /api/qc-validations/batch/1/validate - Run QC untuk batch 1', async () => {
        const response = await makeRequest('POST', `${API_ENDPOINTS.qcValidations}/batch/1/validate`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
        }
        
        if (!response.data.success) {
            throw new Error('QC validation should be successful');
        }
        
        // Validasi semua test harus PASS
        const validations = response.data.results.validations;
        if (validations.DISTRIBUTION_CHECK.status !== 'PASS') {
            throw new Error('DISTRIBUTION_CHECK should PASS');
        }
        if (validations.BOX_COMPOSITION.status !== 'PASS') {
            throw new Error('BOX_COMPOSITION should PASS');
        }
        if (validations.CONSECUTIVE_CHECK.status !== 'PASS') {
            throw new Error('CONSECUTIVE_CHECK should PASS');
        }
    });

    await test('POST /api/qc-validations/batch/2/validate - Run QC untuk batch 2', async () => {
        const response = await makeRequest('POST', `${API_ENDPOINTS.qcValidations}/batch/2/validate`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
        }
        
        if (!response.data.success) {
            throw new Error('QC validation should be successful');
        }
        
        // Validasi semua test harus PASS
        const validations = response.data.results.validations;
        if (validations.DISTRIBUTION_CHECK.status !== 'PASS') {
            throw new Error('DISTRIBUTION_CHECK should PASS');
        }
        if (validations.BOX_COMPOSITION.status !== 'PASS') {
            throw new Error('BOX_COMPOSITION should PASS');
        }
        if (validations.CONSECUTIVE_CHECK.status !== 'PASS') {
            throw new Error('CONSECUTIVE_CHECK should PASS');
        }
    });

    await test('GET /api/qc-validations/batch/1 - Get QC results untuk batch 1', async () => {
        const response = await makeRequest('GET', `${API_ENDPOINTS.qcValidations}/batch/1`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!Array.isArray(response.data) || response.data.length === 0) {
            throw new Error('Should return QC validation results');
        }
    });
}

// ============================================================================
// TEST SUITE 6: PRODUCTION REPORT
// ============================================================================

async function testProductionReport() {
    await test('GET /api/batches/1/report - Get production report untuk batch 1', async () => {
        const response = await makeRequest('GET', `${API_ENDPOINTS.batches}/1/report`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
        }
        
        if (!response.data.success) {
            throw new Error('Report generation should be successful');
        }
        
        // Validasi format report
        if (!response.data.data || !response.data.data.batch_number) {
            throw new Error('Report should contain batch data');
        }
        
        if (response.data.data.batch_number !== 1) {
            throw new Error('Batch number should be 1');
        }
        
        if (!response.data.data.operator_name || response.data.data.operator_name !== 'Amir') {
            throw new Error('Operator name should be Amir');
        }
        
        if (response.data.data.coupons.length !== 5000) {
            throw new Error(`Expected 5000 coupons in report, found ${response.data.data.coupons.length}`);
        }
        
        // Validasi format report text
        if (!response.data.formattedReport || !response.data.formattedReport.includes('No Batch: 1')) {
            throw new Error('Formatted report should contain batch information');
        }
    });

    await test('GET /api/batches/2/report - Get production report untuk batch 2', async () => {
        const response = await makeRequest('GET', `${API_ENDPOINTS.batches}/2/report`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
        }
        
        if (!response.data.success) {
            throw new Error('Report generation should be successful');
        }
        
        // Validasi format report
        if (!response.data.data || !response.data.data.batch_number) {
            throw new Error('Report should contain batch data');
        }
        
        if (response.data.data.batch_number !== 2) {
            throw new Error('Batch number should be 2');
        }
        
        if (!response.data.data.operator_name || response.data.data.operator_name !== 'Nando') {
            throw new Error('Operator name should be Nando');
        }
        
        if (response.data.data.coupons.length !== 5000) {
            throw new Error(`Expected 5000 coupons in report, found ${response.data.data.coupons.length}`);
        }
    });
}

// ============================================================================
// TEST SUITE 7: PRODUCTION LOGS
// ============================================================================

async function testProductionLogs() {
    await test('GET /api/production-logs - List semua production logs', async () => {
        const response = await makeRequest('GET', API_ENDPOINTS.productionLogs);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!Array.isArray(response.data)) {
            throw new Error('Response should be an array');
        }
    });

    await test('GET /api/production-logs/batch/1 - Get production logs untuk batch 1', async () => {
        const response = await makeRequest('GET', `${API_ENDPOINTS.productionLogs}/batch/1`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!Array.isArray(response.data)) {
            throw new Error('Response should be an array');
        }
    });
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('================================================================================');
    console.log('                    TEST OTOMATIS BACKEND API');
    console.log('         Validasi API dan Data Sesuai Kunci Jawaban');
    console.log('================================================================================');
    console.log(`${colors.reset}`);
    
    console.log(`\n${colors.cyan}API Base URL:${colors.reset} ${API_BASE_URL}`);
    console.log(`${colors.cyan}Database:${colors.reset} kupon_berhadiah`);
    console.log(`\n${colors.yellow}Memulai test...${colors.reset}\n`);

    try {
        // Test Suite 1: Database Structure
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 1] Validasi Struktur Database${colors.reset}`);
        await testDatabaseStructure();

        // Test Suite 2: API Endpoints
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 2] Test API Endpoints${colors.reset}`);
        await testAPIEndpoints();

        // Test Suite 3: Generate Coupons
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 3] Test Generate Kupon${colors.reset}`);
        await testGenerateCoupons();

        // Test Suite 4: Coupon Data Validation
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 4] Validasi Data Kupon${colors.reset}`);
        await testCouponData();

        // Test Suite 5: QC Validation
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 5] Test QC Validation${colors.reset}`);
        await testQCValidation();

        // Test Suite 6: Production Report
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 6] Test Production Report${colors.reset}`);
        await testProductionReport();

        // Test Suite 7: Production Logs
        console.log(`\n${colors.bright}${colors.blue}[TEST SUITE 7] Test Production Logs${colors.reset}`);
        await testProductionLogs();

    } catch (error) {
        console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
    }

    // Print Summary
    console.log(`\n${colors.bright}${colors.blue}`);
    console.log('================================================================================');
    console.log('                            TEST SUMMARY');
    console.log('================================================================================');
    console.log(`${colors.reset}`);
    console.log(`${colors.green}Passed:${colors.reset} ${testResults.passed}`);
    console.log(`${colors.red}Failed:${colors.reset} ${testResults.failed}`);
    console.log(`${colors.cyan}Total:${colors.reset} ${testResults.total}`);
    console.log(`${colors.yellow}Success Rate:${colors.reset} ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

    if (testResults.errors.length > 0) {
        console.log(`\n${colors.red}Errors:${colors.reset}`);
        testResults.errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err.name}: ${err.error}`);
        });
    }

    console.log(`\n${colors.bright}${colors.blue}================================================================================${colors.reset}\n`);

    // Close database connection
    config.end();

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
    console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
    config.end();
    process.exit(1);
});

