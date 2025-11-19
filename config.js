require('dotenv').config();
var mysql = require('mysql');

const config = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kupon_berhadiah'
});
config.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
});
module.exports = config;