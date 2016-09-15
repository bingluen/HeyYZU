/* Setting Path  */
global.__mobileAPIBase = __dirname + '/mobileAPI/'
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__attachmentPath =  __dirname + '/attachments/'

/* Module */
const express = require('express');
const bodyParser = require('body-parser');
const connectMultiparty = require('connect-multiparty');
const http = require('http');

/* router module */
const v2Api = require(__mobileAPIBase + 'router/v2Api');

/* setting v2API */
var v2API = express();


/**
 * for post request
 * body-parser => x-www-form-urlencoded
 * connect-multiparty = > form-data
 */
v2API.use(bodyParser.urlencoded({ extended: true }));
v2API.use(bodyParser.json());
v2API.use(connectMultiparty());

/**
 * v2 API Setting Router
 */
v2API.use('/v2', v2Api);

/**
 * Handle Unexpected error
 */
v2API.use(function(err, req, res, next) {
  console.error(err);
  switch(err.status) {
    case 400:
      res.status(400).json({
          statusCode: 1100,
          status: 'JSON parse error'
      });
    default:
      res.status(500).json({
          statusCode: 1200,
          status: 'Unexpected error'
      });
  }
});

// catch 404 and forward to error handler
// next 疑似是擺好看的，官方文件沒說什麼東東會被傳進來
v2API.use(function(req, res, next) {
  console.log('request('+req.path+') 404 Not Found from' + req.ip);
  res.status(404).json({
    statusCode: 404,
    status: "Not found."
  });
});


/* Create http server */
const bind = 6666;
var APIServer = http.createServer(v2API);
APIServer.listen(6666);
APIServer.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

APIServer.on('listening', function() {
  var addr = APIServer.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('v2 mobileAPI active in port 6666.')
});
