"use strict"

const mysql = require('mysql');

function QueryException(obj) {
	console.log(obj)
	let that = this;
	for (var key in obj) {
		var getType = {};
		if (obj[key] && !getType.toString.call(obj[key]) === '[object Function]') {
			that[key] = obj[key];
		}
	}
}

module.exports.query = (query, params, cb) => {
	var database = mysql.createConnection({
		host: __mobileAPIConfig.database.host,
		user: __mobileAPIConfig.database.username,
		password: __mobileAPIConfig.database.password,
		database: __mobileAPIConfig.database.dbname,
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

module.exports.QueryException = QueryException;
