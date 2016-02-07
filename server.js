'use strict'

global.__SystemBase = __dirname + '/'

/* -------Module------- */

var express = require('express');
var http = require('http');

//For Mobile app backend
var mobileAPI = require('./mobileAPI');
//For Web Page
var webPage = require('./webPage');

//letsencrypt
var lex = require('letsencrypt-express');

var config = require('./config.json');

var sslConfig = config.ssl;

/* -----Module-end----- */

if (config.devMode) {
  /* Create WebPage Service */
  var devAPIServer = http.createServer(mobileAPI);
  devAPIServer.listen(4433);

  devAPIServer.on('error', function(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = '4433';

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

  devAPIServer.on('listening', function() {
    var addr = devAPIServer.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('mobileAPI dev mode active in port 4433 without https')
  });

  devAPIServer.on('connection', function(socket) {
    socket.setTimeout(0);
    // 30 second timeout. Change this as you see fit.
   });


} else {
  /* Create WebPage Service */

  lex.create({
    configDir: sslConfig.configDir
      // ~/letsencrypt, /etc/letsencrypt, whatever you want

    ,
    onRequest: webPage
      // your express app (or plain node http app)

    ,
    letsencrypt: null
      // you can provide you own instance of letsencrypt
      // if you need to configure it (with an agreeToTerms
      // callback, for example)

    ,
    approveRegistration: function(hostname, cb) {
      // PRODUCTION MODE needs this function, but only if you want
      // automatic registration (usually not necessary)
      // renewals for registered domains will still be automatic
      cb(null, {
        domains: sslConfig.domains,
        email: sslConfig.email,
        agreeTos: true // you
      });
    }
  }).listen([], [443, 5001], function onListening() {
    var server = this;
    var protocol = ('requestCert' in server) ? 'https' : 'http';
    console.log("Listening at " + protocol + '://'+ sslConfig.domains[0] +':' + this.address().port);
  });

  /* Create mobileAPI Service */

  lex.create({
    configDir: sslConfig.configDir
      // ~/letsencrypt, /etc/letsencrypt, whatever you want

    ,
    onRequest: mobileAPI
      // your express app (or plain node http app)

    ,
    letsencrypt: null
      // you can provide you own instance of letsencrypt
      // if you need to configure it (with an agreeToTerms
      // callback, for example)

    ,
    approveRegistration: function(hostname, cb) {
      // PRODUCTION MODE needs this function, but only if you want
      // automatic registration (usually not necessary)
      // renewals for registered domains will still be automatic
      cb(null, {
        domains: sslConfig.domains,
        email: sslConfig.email,
        agreeTos: true // you
      });
    }
  }).listen([], [4433], function onListening() {
    var server = this;
    var protocol = ('requestCert' in server) ? 'https' : 'http';
    console.log("Listening at " + protocol + '://'+ sslConfig.domains[0] +':' + this.address().port);
  });

  /*
    Auto redirect to https
   */
  // set up plain http server
  var http80 = express();

  // set up a route to redirect http to https
  http80.get('*',function(req,res){
      res.redirect('https://' + sslConfig.domains[0] + req.url)
  });

  // have it listen on 8080
  var http80Server = http.createServer(http80);
  http80Server.listen(80);

  http80Server.on('error', function(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = '80';

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

  http80Server.on('listening', function() {
    var addr = http80Server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Auto redirect HTTP to HTTPS ')
  });

  http80Server.on('connection', function(socket) {
    socket.setTimeout(0);
    // 30 second timeout. Change this as you see fit.
   });
}
