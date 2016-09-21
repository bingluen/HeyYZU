"use strict"

const v2Referrals = require(__mobileAPIBase + 'module/v3/v2Referrals');

module.exports = {
    verify: (req, res, next) => {
      v2Referrals.tokenVerify({token: req.body.token})
        .then((resolve) => {
          if (resolve.httpStatus === 200) {
            res.status(200).json({
              isValid: resolve.isVaild,
              debug: req.debug
            });
          } else {
            res.status(resolve.httpStatus).json({
              statusCode: resolve.statusCode,
              status: resolve.status
            });
          }
        })
    },
    refresh: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    }
}
