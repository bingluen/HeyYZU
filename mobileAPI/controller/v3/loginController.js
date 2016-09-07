"use strict"

const rsaModule = require(__mobileAPIBase + 'module/v3/rsa');
const tokenModule = require(__mobileAPIBase + 'module/v3/token');
const userModule = require(__mobileAPIBase + 'module/v3/user');
const RsaException = rsaModule.RsaException;
const crawler = require(__mobileAPIBase + 'module/v3/crawler');

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
      req.debug.decode = messages;
    } catch (e) {
      let resMes = e;
      resMes.debug = req.debug;
      res.status(400).json(resMes);
      return;
    }

    // try parse JSON string
    try {
      messages = JSON.parse(messages);
      req.debug.decode = messages;
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

    // verify user
    let verifyUser = crawler.verifyPortalAccount(userData.username, userData.password);

    verifyUser
      .then(() => userModule.find(userData.username))
      .then((result) => {
        if (result) {
          return userModule.updatePw(result.uid, rsaModule.pubEncrypt(userData.password))
            .then(() => tokenModule.create(result.uid, userData.MACAddress));
        } else {
          return userModule.create({
            username: userData.username,
            password: rsaModule.pubEncrypt(userData.password)
          })
          .then((uid) => tokenModule.create(uid, userData.MACAddress))
        }
      })
      .then(
        (resolveTask) => {
          res.set('Cache-Control', 'no-store');
          res.set('Pragma', 'no-cache');
          res.status(200).json({
            token: resolveTask.token,
            expire_in: resolveTask.expire_in,
            debug: req.debug
          });
        },
        (rejectTask) => {
          console.log("rejectTask", rejectTask);
          let resMes = rejectTask;
          resMes.debug = req.debug;
          res.status(500).json(resMes);
        }
      );
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
