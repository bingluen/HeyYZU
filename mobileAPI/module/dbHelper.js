var mysql = require('mysql');

var database = {};

database = mysql.createConnection({
	host: __mobileAPIConfig.database.host,
	user: __mobileAPIConfig.database.username,
	password: __mobileAPIConfig.database.password,
	database: __mobileAPIConfig.database.dbname,
	multipleStatements: true,
	timezone: '0000'
});

module.exports = database;
