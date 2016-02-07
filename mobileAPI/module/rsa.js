var ursa = require('ursa');
var fs = require('fs-extra');

var privateKey = fs.readFileSync(__mobileAPIBase + __mobileAPIConfig.RSA.private);
var publicKey = fs.readFileSync(__mobileAPIBase + __mobileAPIConfig.RSA.public);

var priRSA = ursa.createPrivateKey(privateKey);
var pubRSA = ursa.createPublicKey(publicKey);

module.exports.pubEncrypt = function(str) {
  return pubRSA.encrypt(str, 'utf8' , 'base64', ursa.RSA_PKCS1_PADDING);
}

module.exports.pubDecrypt = function(hash) {
  return pubRSA.publicDecrypt(hash, 'base64' , 'utf8');
}

module.exports.priEncrypt = function(str) {
  return priRSA.privateEncrypt(str, 'utf8', 'base64');
}

module.exports.priDecrypt = function(hash) {
  return priRSA.decrypt(hash, 'base64', 'utf8', ursa.RSA_PKCS1_PADDING);
}
