"use strict"

var tokenHelper = require( __mobileAPIBase + 'module/v2/token');
var helper = require( __mobileAPIBase + 'module/v2/helper');
var calendar = require( __mobileAPIBase + 'module/v2/calendar');

function verifyToken(token) {
  return new Promise((reslove, reject) => {
    tokenHelper.verifyToken(token, function(err, result) {
      if (err) {
        console.error((new Date(Date.now())).toISOString(), 'Occure error when verify token.');
        console.error((new Date(Date.now())).toISOString(), err);
        reject();
      } else if (result) {
        reslove(result);
      } else {
        reject();
      }
    });
  });
}

module.exports.calendar = (req, res, next) => {
  if (!req.body.token) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  let key = {
    year: helper.getYearNow() + 1911
  }

  if (req.query.year && Number.isInteger(req.query.year) && req.query.year <= helper.getYearNow()) {
    key.start_year = req.query.year + 1911
  }

  verifyToken(req.body.token)
  .then(
    (resloveTask) => {
      if (resloveTask.isVaild) {
        return calendar.getCalendar(key)
      } else {
        res.status(400).json({
          statusCode: 1102,
          status: 'token is invaild.'
        });
      }
    },
    (rejectTask) => {
      res.status(500).json({
        statusCode: 1202,
        status: 'API service internal error.'
      });
    }
  )
  .then(
    (resloveTask) => {
      res.status(200).json({
        statusCode: 200,
        status: 'get calendar successful!',
        data: resloveTask
      })
    },
    (rejectTask) => {
      res.status(500).json({
        statusCode: 1201,
        status: 'API service internal error.'
      });
    }
  )
}
