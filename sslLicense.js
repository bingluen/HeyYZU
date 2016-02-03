var fs = require('fs');

//ssl license

var keyPath = '/etc/letsencrypt/live/hey.yzu.us/privkey.pem';
var certPath = '/etc/letsencrypt/live/hey.yzu.us/cert.pem';

var hskey = fs.readFileSync(keyPath);
var hscert = fs.readFileSync(certPath);

var options = {
    key: hskey,
    cert: hscert
};

//ssl object

var ssl = {};

ssl.options = options;

module.exports = ssl;
