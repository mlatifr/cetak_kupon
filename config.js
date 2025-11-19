var mysql = require('mysql');

const config = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'kupon_berhadiah'
});
config.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
});
module.exports = config;