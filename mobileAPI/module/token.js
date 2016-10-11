var zpad = require('zpad');
var crypto = require('crypto');
var dbHelper = require(__mobileAPIBase + 'module/dbHelper');
var rsa = require(__mobileAPIBase + 'module/rsa');

module.exports.createToken = function(userData, next) {
  /*
    Token 規則
    RSA ( base64 ( id(l=20) + '-CHUANGBINGLUEN-' + md5 ( deviceId + token MFD + '-ERICKSON-') + '-MAKOTOKI-' + userData.deviceMAC ) )
   */
  
  var mfd = new Date(Date.now());
  //捨去millisecond，因為資料庫無法儲存millisecond
  mfd.setMilliseconds(0);
  var exp = (new Date(mfd));

  // Setting exp time ( 2 days)
  exp.setDate(exp.getDate() + 2);
  
  var newToken = rsa.pubEncrypt(
    new Buffer(
      zpad(userData.uid, 20)
      + '-CHUANGBINGLUEN-'
      + crypto.createHash('md5').update( userData.deviceId + mfd.toISOString() + '-ERICKSON-').digest('base64')
        + '-MAKOTOKI-'
        + parseInt(userData.deviceMAC.replace(/:/g, ''), 16)
      ).toString('base64'));

  var queryStatement = ""
    + "INSERT INTO device (owner_user, deviceMAC, deviceId, deviceOS, deviceOSVer, deviceName, accessToken, mfd, exp)"
    + "VALUES(?,"
    + "      CONV(REPLACE(?, ':', ''), 16, 10),"
    + "       ?,"
    + "       ?,"
    + "       ?,"
    + "       ?,"
    + "       ?,"
    + "       CONVERT(?, datetime),"
    + "       CONVERT(?, datetime)) ON DUPLICATE KEY "
    + "UPDATE "
    + "    owner_user = ?, "
    + "    deviceId = ?,"
    + "    deviceOS = ?,"
    + "    deviceOSVer = ?,"
    + "    deviceName = ?,"
    + "    accessToken = ?,"
    + "    mfd = CONVERT(?, datetime),"
    + "    exp = CONVERT(?, datetime);"
  ;

  var queryParams = [];
  queryParams.push(userData.uid);
  queryParams.push(userData.deviceMAC);
  queryParams.push(userData.deviceId);
  queryParams.push(userData.deviceInfo.os);
  queryParams.push(userData.deviceInfo.osVer);
  queryParams.push(userData.deviceInfo.device);
  queryParams.push(newToken);
  queryParams.push(mfd.toISOString().slice(0, 19).replace('T', ' '));
  queryParams.push(exp.toISOString().slice(0, 19).replace('T', ' '));
  queryParams.push(userData.uid);
  queryParams.push(userData.deviceId);
  queryParams.push(userData.deviceInfo.os);
  queryParams.push(userData.deviceInfo.osVer);
  queryParams.push(userData.deviceInfo.device);
  queryParams.push(newToken);
  queryParams.push(mfd.toISOString().slice(0, 19).replace('T', ' '));
  queryParams.push(exp.toISOString().slice(0, 19).replace('T', ' '));

  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if (err) {
      next(err);
    } else {
      next(null, {
        token: newToken,
        mfd: mfd,
        exp: exp
      });
    }
  });
}

module.exports.verifyToken = function(token, next) {
  var queryStatement = ""
    + "SELECT deviceMAC, deviceId, mfd, exp FROM device WHERE owner_user = ? and deviceMAC = ?";
  var plainToken = rsa.priDecrypt(token);
  if (plainToken === false) {
    next(null, {
      isVaild: false
    })
    return;
  }
  var plainText = new Buffer(plainToken, 'base64').toString();
  var user_uid = parseInt(plainText.slice(0, 21), 10);
  var deviceMAC = parseInt(plainText.substr(plainText.indexOf('-MAKOTOKI-') + '-MAKOTOKI-'.length), 10);
  var rawCode = plainText.slice(plainText.indexOf('-CHUANGBINGLUEN-') + '-CHUANGBINGLUEN-'.length, plainText.indexOf('-MAKOTOKI-'));

  if (!user_uid || !rawCode || !deviceMAC) {
    next(null, {
      isVaild: false
    })
    return;
  }

  var query = dbHelper.query(queryStatement, [user_uid, deviceMAC], function(err, result, field){

    if (!result[0]) {
      next(null, {
        isVaild: false
      })
      return;
    }

    if (err) {
      next(err);
    } else {
      if ( (new Date(result[0].exp + ' GMT+0000')).getTime() < (new Date()).getTime() ) {
        next(null, {
          isVaild: false
        })
        return;
      }

      var checkCode = crypto.createHash('md5').update( result[0].deviceId + new Date(result[0].mfd + ' GMT+0000').toISOString() + '-ERICKSON-').digest('base64');

      next(null, {
        uid: user_uid,
        isVaild: checkCode === rawCode,
        exp: new Date(result[0].exp + ' GMT+0000').toISOString(),
        mfd: new Date(result[0].mfd + ' GMT+0000').toISOString()
      });
    }

  });
}

module.exports.invalidateToken = (uid, next) => {
  //set exp to 元智創校年份
  var queryStatement = "UPDATE device SET exp = MAKEDATE(1989,1) WHERE owner_user in (";
  var params;

  if (uid instanceof Array) {
    uid.forEach((cv, i, arr) => {
      queryStatement += "?";
      if (i < arr.length - 1) {
        queryStatement += ", ";
      }
    });
    params = uid;
  } else {
    queryStatement += "?";
    params = [uid]
  }

  queryStatement += ");";
  var query = dbHelper.query(queryStatement, params, (err, result, field) => {
    if (err) {
      next({isErr: true, msg: err, query: query});
    } else {
      next({isErr: false});
    }
  });
}
