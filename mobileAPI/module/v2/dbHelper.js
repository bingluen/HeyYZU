var mysql = require('mysql');



module.exports.query = (query, params, cb) => {
	var database = mysql.createConnection({
		host: __mobileAPIConfig.v2.database.host,
		user: __mobileAPIConfig.v2.database.username,
		password: __mobileAPIConfig.v2.database.password,
		database: __mobileAPIConfig.v2.database.dbname,
		multipleStatements: true,
		timezone: '0000'
	});

	database.connect()

	var query = database.query(query, params, (err, result, field) => {
		cb(err, result, field)
		database.end();
	});
	return query;
};
