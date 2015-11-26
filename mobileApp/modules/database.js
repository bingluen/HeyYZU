var mysql = require('mysql');

var database = {};

database = mysql.createConnection({
	host: __MobileConfig.dbhost,
	user: __MobileConfig.username,
	password: __MobileConfig.password,
	database: __MobileConfig.dbname,
	multipleStatements: true
});

module.exports = database;
