/* Setting Path  */
global.__mobileAPIBase = __dirname + '/mobileAPI/'
//global.__MobileConfig = require(__mobileAPIBase + 'config.json');

/* Module */
var express = require('express');
var bodyParser = require('body-parser');
var connectMultiparty = require('connect-multiparty');


/* Project module */
//var UserRouter = require(__mobileAPIBase + 'router/user');

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
 * Setting Router
 */
//app.use('/user', UserRouter);


// catch 404 and forward to error handler
// next 疑似是擺好看的，官方文件沒說什麼東東會被傳進來
app.use(function(req, res, next) {
  console.log('request('+req.path+') 404 Not Found from' + req.ip)
  res.status(404).json({
    status: 404,
    mes: 'Not Found'
  })
});

module.exports = app;
