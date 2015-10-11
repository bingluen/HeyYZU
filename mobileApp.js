/* Module */
var express = require('express');

/* Project module */
var Logging = require('./modules/loggin').('service');

var UserRouter = require('./mobileApp/router/user');

/* setting app */
var app = express();

// catch 404 and forward to error handler
// next 疑似是擺好看的，官方文件沒說什麼東東會被傳進來
app.use(function(req, res, next) {
  Logging.writeMessage('404 Not Found' + req, 'error')
  res.status(404).json({
    status: 404,
    mes: 'Not Found'
  })
});

module.exports = app;
