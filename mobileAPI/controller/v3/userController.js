"use strict"
const v2Referrals = require(__mobileAPIBase + 'module/v3/v2Referrals');

module.exports = {
  getCourses: (req, res, next) => {
    v2Referrals.userCourse({token: req.query.token})
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          res.status(200).json(resolve.data.map((cv) => cv.lesson_id));
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
      });
  },
  refreshCourse: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  refreshDeviceToken: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  getDevices: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  }
}
