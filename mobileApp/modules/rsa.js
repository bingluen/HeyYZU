var NodeRSA = require('node-rsa');
var fs = require('fs-extra');

var privateKey = fs.readFileSync(__MobileAppBase + __MobileConfig.rsaKey.private).toString().replace(/\n/g, '');
var publicKey = fs.readFileSync(__MobileAppBase + __MobileConfig.rsaKey.public).toString().replace(/\n/g, '');

module.exports = function(type) {
  var nodersa
  if(type === 'private') {
    nodersa = new NodeRSA(privateKey, 'pkcs1', {b:4096});
  } else {
    nodersa = new NodeRSA(publicKey, 'public', {b:4096});
  }

  return nodersa;

};
