'use strict'

global.__SystemBase = __dirname + '/'

/* -------Module------- */

//For Mobile app backend
var mobileAPI = require('./mobileAPI');
//For Web Page
var webPage = require('./webPage');

//letsencrypt
var lex = require('letsencrypt-express');

var sslConfig = require('./ssl.config.json');

/* -----Module-end----- */


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
}).listen([80], [443, 5001], function onListening() {
  var server = this;
  var protocol = ('requestCert' in server) ? 'https' : 'http';
  console.log("Listening at " + protocol + '://localhost:' + this.address().port);
});
