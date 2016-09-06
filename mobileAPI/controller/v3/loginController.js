"use strict"

const rsaModule = require(__mobileAPIBase + 'module/v3/rsa');
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
      messages = rsaModule.priDecrypt(req.body.messages)
    } catch (e) {
      let resMes = e;
      resMes.debug = req.debug;
      res.status(400).json(resMes);
      return;
    }

    // try parse JSON string
    try {
      messages = JSON.parse(messages)
    } catch (e) {
      let resMes = e;
      resMes.debug = req.debug;
      res.status(400).json(resMes);
      return;
    }

    // get JSON data column
    let userData = {};
    try {
      userData.username = getProp(messages, "username");
      userData.password = getProp(messages, "password");
    } catch (e) {
      if (e instanceof RsaException) {
        let resMes = e;
        resMes.debug = req.debug;
        res.status(400).json(resMes);
        return;
      } else if (e instanceof ReferenceError) {
        res.status(400).json({
          statusCode: 1101,
          status: "Params illegal.",
          error: e.toString().replace("ReferenceError: ", ""),
          debug: req.debug
        });
        return;
      }
    }

    // verify user
    let verifyUser = crawler.verifyPortalAccount(userData.username, userData.password);

    verifyUser.then(
      (resloveTask) => {
        res.set('Cache-Control', 'no-store');
        res.set('Pragma', 'no-cache');
        res.status(200).json({
          statusCode: 200,
          status: "Successful.",
          debug: req.debug
        });
      },
      (rejectTask) => {
        let resMes = rejectTask;
        resMes.debug = req.debug;
        res.status(500).json(resMes);
      }
    );
  }
}
