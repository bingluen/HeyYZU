var mysql = require('mysql');



module.exports.query = (query, params, cb) => {
	var dbPool = mysql.createPool({
		host: __mobileAPIConfig.database.host,
		user: __mobileAPIConfig.database.username,
		password: __mobileAPIConfig.database.password,
		database: __mobileAPIConfig.database.dbname,
		multipleStatements: true,
		timezone: '0000',
		charset: 'utf8_general_ci'
	});

	dbPool.getConnection(function(err, connection) {
	  // Use the connection
	  connection.query(query, params, function(err, result, field) {
	    // And done with the connection.
	    cb(err, result, field)
	    connection.release();
	    // Don't use the connection here, it has been returned to the pool.
	  });
	});
	return {
		sql: 'deprecated'
	};
};
