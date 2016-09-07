/* Setting Path  */
global.__mobileAPIBase = __dirname + '/mobileAPI/'
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__attachmentPath = __dirname + '/attachments/'

/* Module */
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const connectMultiparty = require('connect-multiparty');

/* router module */
const v3Api = require(__mobileAPIBase + 'router/v3Api')

/* setting APIService */
var APIService = express();


/**
 * for post request
 * body-parser => x-www-form-urlencoded
 * connect-multiparty = > form-data
 */
APIService.use(bodyParser.urlencoded({ extended: true }));
APIService.use(bodyParser.json());
APIService.use(connectMultiparty());

/**
 * Debug mode for APP client
 */
APIService.use('/v3', (req, res, next) => {
  if (req.query.debug == "true") {
    req.debug = {
      body: req.body,
      query: req.query,
      params: req.params
    }
  }
  next();
});

/**
 * API Version Setting Router
 */
APIService.use('/v3', v3Api);

/**
 * Handle Unexpected error
 */
APIService.use(function(err, req, res, next) {
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
APIService.use(function(req, res, next) {
  console.log('request('+req.path+') 404 Not Found from' + req.ip)
  res.status(404).json({
    statusCode: 404,
    status: "Not found."
  });
});


/* Create http server */
const bind = 8888;
var APIServer = http.createServer(APIService);
APIServer.listen(8888);
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
  console.log('mobileAPI active in port 8888.')
});
