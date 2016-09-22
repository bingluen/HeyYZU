"use strict"
const v2Referrals = require(__mobileAPIBase + 'module/v3/v2Referrals');

module.exports = {
  getCourses: (req, res, next) => {
    if (req.query.current === "true") {
      v2Referrals.courseInfo({token: req.query.token})
        .then((resolve) => {
          if (resolve.httpStatus === 200) {
            let data = resolve.data.map((cv) => {
              cv.lessonClassroom = Object.keys(cv.lessonClassroom).map((key) => ({time: key, classroom: cv.lessonClassroom[key]}));
              return cv;
            })
            res.status(200).json(resolve.data);
          } else {
            res.status(resolve.httpStatus).json({
              statusCode: resolve.statusCode,
              status: resolve.status
            });
          }
        });
    } else {
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
    }
  },
  refreshCourse: (req, res, next) => {
    v2Referrals.userRefreshCourse(req.body)
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          res.status(200).json({msg: resolve.status});
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
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
