/* Setting Path  */
global.__WebPageBase = __dirname + '/webPage/'
global.__mobileAPIBase = __dirname + '/mobileAPI/'
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__attachmentPath = __SystemBase + '/attachments/'

/* Module */
var express = require('express');
var bodyParser = require('body-parser');
var connectMultiparty = require('connect-multiparty');

/* router module */
var v2Api = require(__mobileAPIBase + 'router/v2Api');
var v3Api = require(__mobileAPIBase + 'router/v3Api')

/* setting webService */
var webService = express();


/**
 * for post request
 * body-parser => x-www-form-urlencoded
 * connect-multiparty = > form-data
 */
webService.use(bodyParser.urlencoded({ extended: true }));
webService.use(bodyParser.json());
webService.use(connectMultiparty());

/**
 * API Version Setting Router
 */
webService.use('/v2', v2Api);
webService.use('/v3', v3Api);

/* setting router */
webService.use('/', express.static( __WebPageBase + 'public'));


/**
 * Handle Unexpected error
 */
webService.use(function(err, req, res, next) {
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
webService.use(function(req, res, next) {
  console.log('request('+req.path+') 404 Not Found from' + req.ip)
  res.status(404).sendFile( __WebPageBase + '404.html')
});

module.exports = webService;
