var rsa = require(__mobileAPIBase + 'module/rsa');

module.exports = function(plainText) {
  var plainText = plainText || "!@#$%^&* RSA Testing, RSA測試 !@#$%^&*";
  var result = true;
  var cipherText = rsa.pubEncrypt(plainText);

try {
  console.log("============ pub encrypt -> pri decrypt ============");
  console.log("\tplainText   = " + plainText);
  //console.log("\tcipherText  = " + cipherText);
  var priDecrypt = rsa.priDecrypt(cipherText);
  console.log("\tdecryptText = " + priDecrypt);
  console.log("\tplainText === decryptText ?", priDecrypt === plainText);
  result = result && priDecrypt === plainText;

  cipherText = rsa.priEncrypt(plainText);
  console.log("============ pri encrypt -> pub decrypt ============");
  console.log("\tplainText   = " + plainText);
  //console.log("\tcipherText  = " + cipherText);
  var pubDecrypt = rsa.pubDecrypt(cipherText);
  console.log("\tdecryptText = " + pubDecrypt);
  console.log("\tplainText === decryptText ?", pubDecrypt === plainText);
  result = result && pubDecrypt === plainText;
} catch(e) {
  result = false;
  console.log(e);
}
  return result ? "Pass" : "Failed";
}
