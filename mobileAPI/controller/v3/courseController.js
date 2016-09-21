"use strict"

const v2Referrals = require(__mobileAPIBase + 'module/v3/v2Referrals');

module.exports = {
    getCourseInfo: (req, res, next) => {
      v2Referrals.courseInfo({token: req.query.token, key: {lesson_id: parseInt(req.params.courseId, 10)}})
        .then((resolve) => {
          if (resolve.httpStatus === 200) {
            res.status(200).json(resolve.data);
          } else {
            res.status(resolve.httpStatus).json({
              statusCode: resolve.statusCode,
              status: resolve.status
            });
          }
        });
    },
    getHomeworks: (req, res, next) => {
      v2Referrals.courseHomework({token: req.query.token, key: {lesson_id: parseInt(req.params.courseId, 10)}})
        .then((resolve) => {
          if (resolve.httpStatus === 200) {
            res.status(200).json(resolve.data.map((cv) => { cv.filename = cv.filename.replace(/\+/, " ").replace(/null/, ""); return cv;}));
          } else {
            res.status(resolve.httpStatus).json({
              statusCode: resolve.statusCode,
              status: resolve.status
            });
          }
        });
    },
    getNotices: (req, res, next) => {
      v2Referrals.courseNotice({token: req.query.token, key: {lesson_id: parseInt(req.params.courseId, 10)}})
        .then((resolve) => {
          if (resolve.httpStatus === 200) {
            res.status(200).json(resolve.data);
          } else {
            res.status(resolve.httpStatus).json({
              statusCode: resolve.statusCode,
              status: resolve.status
            });
          }
        });
    },
    getMaterials: (req, res, next) => {
      v2Referrals.courseMaterial({token: req.query.token, key: {lesson_id: parseInt(req.params.courseId, 10)}})
        .then((resolve) => {
          if (resolve.httpStatus === 200) {
            res.status(200).json(resolve.data);
          } else {
            res.status(resolve.httpStatus).json({
              statusCode: resolve.statusCode,
              status: resolve.status
            });
          }
        });
    },
    getAttachment: (req, res, next) => {
      res.redirect("https://v2api.heyyzu.bingluen.tw/v2/course/attachments/" + req.params.id + "?token=" + encodeURIComponent(req.query.token));
    }
}
