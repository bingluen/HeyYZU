var ursa = require('ursa');
var fs = require('fs-extra');

var privateKey = fs.readFileSync(__MobileAppBase + __MobileConfig.rsaKey.private);
var publicKey = fs.readFileSync(__MobileAppBase + __MobileConfig.rsaKey.public);

module.exports = function(type) {
  if(type === 'private') {
    return ursa.createPrivateKey(privateKey);
  } else {
    return ursa.createPublicKey(publicKey);
  }

};
