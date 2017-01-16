var mysql = require('mysql');
var dbPool = mysql.createPool({
	host: __mobileAPIConfig.database.host,
	user: __mobileAPIConfig.database.username,
	password: __mobileAPIConfig.database.password,
	database: __mobileAPIConfig.database.dbname,
	multipleStatements: true,
	timezone: '0000',
	charset: 'utf8_general_ci'
});


module.exports.query = (query, params, cb) => {
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

module.exports.transaction = (query, params) => {
	return new Promise((resolve, reject) => {
		db.pool.getConnection((err, connection) => {

			if (err) { reject(err); } // get connection failed
			
			else {
				connection.beginTransaction((err) => {

					if (err) {
						reject(err); // begin transaction failed
						connection.release(); // release connection
					} else {
						connection.query(query, params, (err, result, field) => {
							if (err) {
								connection.rollback(() => { // do query failed
									reject(err)
									connection.release(); // release connection
								});
							} else {
								connection.commit((err) => {
									if (err) {
										connection.rollback(() => { // do commit failed
											reject(err);
											connection.release(); // release connection
										});
									} else {
										resolve(result); // transaction successful
										connection.release(); // release connection
									}
								});
							}
						});
					}

				});
			}
		});
	});
}

module.exports.queryPromise = (query, params) => {
	return new Promise((resolve, reject) => {
		dbPool.getConnection(function(err, connection) {
		  // Use the connection
		  connection.query(query, params, function(err, result, field) {
		    // And done with the connection.
		    if (err) {
					resolve(result);
				} else {
					reject(err);
				}
		    connection.release();
		    // Don't use the connection here, it has been returned to the pool.
		  });
		});
	})
}
