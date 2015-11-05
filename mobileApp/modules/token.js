var zpad = require('zpad');
var crypto = require('crypto');
var moment = require('moment');
var Database = require(__MobileAppBase + 'modules/database');
var RSA = require(__MobileAppBase + 'modules/rsa');
var privateRSA = RSA('private');

module.exports.createToken = function(userData) {
  //Token 規則 RSA ( id(l=11) + md5 (lastVerifyTime + portalUsername + birth) )
  moment.locale('zh-tw')

  var queryStatment = 'UPDATE user set lastVerifyTime = ? Where portalUsername = ?';
  var nowTime = moment().format('YYYY-MM-DD hh:mm:ss');
  Database.query(queryStatment, [moment().format('YYYY-MM-DD hh:mm:ss'), userData.portalUsername], function(err, row, field) { if(err) console.log(err) })

  return new Buffer(zpad(userData.id, 11) + '-ERICKSON-' + crypto.createHash('md5').update( nowTime + userData.portalUsername + '-CHUANG-' + moment(userData.birth).format('LLdddd')).digest('base64')).toString('base64')
}

module.exports.verifyToken = function(token, next) {
  var decode = new Buffer(token, 'base64').toString()
  var userid = decode.slice(0, 11)
  var queryStatment = 'SELECT * From user Where id = ?';
  Database.query(queryStatment, [userid], function(err, row, field) {
    if (row.length != 1) {
      next(false)
    } else {
      moment.locale('zh-tw')
      if(moment() - moment(row[0].lastVerifyTime) > 172800000) // 172800000 = two days
      {
        next(false)
        return;
      }
      var verifyHash = crypto.createHash('md5').update(moment(row[0].lastVerifyTime).format('YYYY-MM-DD hh:mm:ss')  + row[0].portalUsername + '-CHUANG-' + moment(row[0].birth).format('LLdddd')).digest('base64')
      if(decode.slice(21, decode.length) === verifyHash) {
        next(true, row[0])
      } else {
        next(false)
      }
    }
  })
}
