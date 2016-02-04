/* Setting Path  */
global.__mobileAPIBase = __dirname + '/mobileAPI/'
//global.__MobileConfig = require(__mobileAPIBase + 'config.json');

/* Module */
var express = require('express');
var bodyParser = require('body-parser');
var connectMultiparty = require('connect-multiparty');


/* router module */
var v2Api = require(__mobileAPIBase + 'router/v2Api');

/* setting app */
var app = express();

/**
 * for post request
 * body-parser => x-www-form-urlencoded
 * connect-multiparty = > form-data
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(connectMultiparty());

/**
 * Version Setting Router
 */
app.use('/v2', v2Api);


// catch 404 and forward to error handler
// next 疑似是擺好看的，官方文件沒說什麼東東會被傳進來
webPage.use(function(req, res, next) {
  res.status(404).json({
    status: 404,
    messages: {'Not Found'}
  })
});

module.exports = app;
