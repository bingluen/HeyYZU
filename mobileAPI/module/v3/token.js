"use strict"

const crypto = require('crypto');
const rsaModule = require(__mobileAPIBase + 'module/v3/rsa');
const dbModule = require(__mobileAPIBase + 'module/v3/db');

module.exports = {
  verify: (token) => {
    let deRsa = rsaModule.priDecrypt(token);
    let md5Text = deRsa.replace(/-CHUANGBINGLUEN-|-MAKOTOKI-/g, '');
    return new Promise((resolve, reject) => {
      let query = dbModule.query(
        "SELECT 1 FROM device WHERE addtime(mfd, 10000) >= now() AND md5(concat( "
        + "left(HEX(MACAddress), 2), ':', "
        + "substring(HEX(MACAddress), 3, 2), ':', "
        + "substring(HEX(MACAddress), 5, 2), ':', "
        + "substring(HEX(MACAddress), 7, 2), ':', "
        + "substring(HEX(MACAddress), 9, 2), ':', "
        + "right(HEX(MACAddress), 2), "
        + "DATE_FORMAT(mfd, '%Y-%m-%dT%T.000Z'), '-ERICKSON-')) = ?;",
        [md5Text],
        (err, result, field) => {
          if (err) {
            throw new dbModule.QueryException(err);
          } else if (result.length > 0)  {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );
    });
  },
  create: (user_uid, MACAddress) => {
    MACAddress = MACAddress.toUpperCase();
    let mfd = new Date(Date.now());
    //捨去millisecond，因為資料庫無法儲存millisecond
    mfd.setMilliseconds(0);
    let newToken = (new Buffer(
      rsaModule.pubEncrypt(
        '-CHUANGBINGLUEN-'
        + crypto.createHash('md5').update(
          MACAddress + mfd.toISOString() + '-ERICKSON-'
        ).digest('hex')
        + '-MAKOTOKI-')
      )
    ).toString();
    return new Promise((resolve) => {
      let query = dbModule.query(
        "INSERT INTO device "
        + "(user, MACAddress, mfd, token) VALUES(?, CONV(REPLACE(?, ':', ''), 16, 10), CONVERT(?, datetime), ?) "
        + "ON DUPLICATE KEY UPDATE token = ?, mfd = CONVERT(?, datetime);",
        [user_uid, MACAddress, mfd.toISOString(), newToken, newToken, mfd.toISOString()],
        (err, reslut, field) => {
          if (err) {
            throw new dbModule.QueryException(err);
          } else {
            resolve({
              token: newToken,
              expire_in: 3600
            });
          }
        }
      );
    });
  }
}
