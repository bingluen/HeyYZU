'use strict'

global.__SystemBase = __dirname + '/'

/* -------Module------- */

var express = require('express');
var http = require('http');

//webService
var webService = require('./webService');

//letsencrypt
var lex = require('letsencrypt-express');

var config = require('./config.json');

var sslConfig = config.ssl;

/* -----Module-end----- */

if (config.devMode) {
  /* Create WebPage Service */
  var devAPIServer = http.createServer(webService);
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
  /* Create webService Service */

  lex.create({
    configDir: sslConfig.configDir
      // ~/letsencrypt, /etc/letsencrypt, whatever you want

    ,
    onRequest: webService
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
    for (var i in sslConfig.domains) {
    	console.log("Listening at " + protocol + '://'+ sslConfig.domains[i] +':' + this.address().port);
    }
  });

  /* Create auto redirect Service */
  {
    let redirectService = http.createServer(function(req, res, error) {
      res.setHeader('Location', 'https://' + req.headers.host + req.url);
      res.statusCode = 302;
      res.end('<!-- automatically use HTTPS instead -->');
    })
    .listen(80);


    redirectService.on('error', function(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }

      let bind = '80'

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

    redirectService.on('listening', function() {
      let addr = redirectService.address();
      let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      console.log('Redirect http to https automatically.')
    });

    redirectService.on('connection', function(socket) {
      socket.setTimeout(0);
      // 30 second timeout. Change this as you see fit.
     });
  }
}
