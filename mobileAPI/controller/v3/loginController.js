"use strict"

const rsaModule = require(__mobileAPIBase + 'module/v3/rsa');
const RsaException = rsaModule.RsaException;
const v2Referrals = require(__mobileAPIBase + 'module/v3/v2Referrals');

function getProp(obj, prop) {
  if (obj.hasOwnProperty(prop)) return obj[prop];
  else throw new ReferenceError('The value `' + prop +
    '` is not exist');
}

module.exports = {
  student: (req, res, next) => {
    // check request body
    if (!req.body.messages) {
      res.status(400).json({
        statusCode: 1101,
        status: "Params illegal.",
        debug: req.debug
      });
      return;
    }

    // try to decrypt messages
    var messages;
    try {
      messages = rsaModule.priDecrypt(req.body.messages);
    } catch (e) {
      let resMes = e;
      resMes.debug = req.debug;
      res.status(400).json(resMes);
      return;
    }

    // try parse JSON string
    try {
      messages = JSON.parse(messages);
    } catch (e) {
      let resMes = e;
      resMes.debug = req.debug;
      resMes.debug.body.decode = messages
      res.status(400).json(resMes);
      return;
    }

    // get JSON data column
    let userData = {};
    try {
      userData.username = getProp(messages, "username");
      userData.password = getProp(messages, "password");
      userData.MACAddress = getProp(messages, "MACAddress");
    } catch (e) {
      req.debug.body.decode = messages
      res.status(400).json({
        statusCode: 1101,
        status: "Params illegal.",
        error: e.toString().replace("ReferenceError: ", ""),
        debug: req.debug
      });
      return;
    }

    // re-package data for v2 api
    let dataPackage = {
      username: userData.username,
      password: userData.password,
      deviceMAC: userData.MACAddress,
      deviceId: "fake deviceId - FCM not enable",
      deviceInfo: {
        os: "Android",
        osVer: "6.0",
        device: "Fake device - no info"
      }
    };

    // Referrals to v2 api
    v2Referrals
      .login({
        messages: rsaModule.pubEncrypt(JSON.stringify(dataPackage))
      })
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          let expIn = (new Date(resolve.tokenExp) - new Date(resolve.tokenMfd)) / 1000;
          res.status(200).json({
            token: resolve.token,
            expire_in: expIn,
            debug: req.debug
          });
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
      })
      ;

  },
  logout: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  logoutAll: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  }
}
