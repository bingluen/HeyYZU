var ursa = require('ursa');
var fs = require('fs-extra');

var privateKey = fs.readFileSync(__mobileAPIBase + __mobileAPIConfig.v2.RSA.private);
var publicKey = fs.readFileSync(__mobileAPIBase + __mobileAPIConfig.v2.RSA.public);

var priRSA = ursa.createPrivateKey(privateKey);
var pubRSA = ursa.createPublicKey(publicKey);

module.exports.pubEncrypt = function(str) {
  try {
    return pubRSA.encrypt(str, 'utf8' , 'base64', ursa.RSA_PKCS1_PADDING);
  } catch (e) {
    return false;
  }
}

module.exports.pubDecrypt = function(hash) {
  try {
    return pubRSA.publicDecrypt(hash, 'base64' , 'utf8');
  } catch (e) {
    return false;
  }
}

module.exports.priEncrypt = function(str) {
  try {
    return priRSA.privateEncrypt(str, 'utf8', 'base64');
  } catch (e) {
    return false;
  }
}

module.exports.priDecrypt = function(hash) {
  try {
    return priRSA.decrypt(hash, 'base64', 'utf8', ursa.RSA_PKCS1_PADDING);
  } catch (e) {
    return false;
  }
}
