/* Setting Path  */
global.__WebPageBase = __dirname + '/webPage/'

/* Module */
var express = require('express');

/* setting webPage */
var webPage = express();

/* setting router */
webPage.use('/', express.static( __WebPageBase + 'public'));

// catch 404 and forward to error handler
// next 疑似是擺好看的，官方文件沒說什麼東東會被傳進來
webPage.use(function(req, res, next) {
  console.log('request('+req.path+') 404 Not Found from' + req.ip)
  res.status(404).sendFile( __WebPageBase + '404.html')
});

module.exports = webPage;
