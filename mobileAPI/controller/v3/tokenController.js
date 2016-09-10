"use strict"
const tokenModule = require(__mobileAPIBase + 'module/v3/token');

module.exports = {
    verify: (req, res, next) => {
      tokenModule.verify(req.body.token)
        .then((result) => {
          res.status(200).json({
            isValid: result
          });
        }, (rejectTask) => {
          let resMes = rejectTask;
          resMes.debug = req.debug;
          res.status(500).json(resMes);
        })
      ;
    },
    refresh: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    }
}
