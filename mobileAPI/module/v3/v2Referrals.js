"use strict"

const rootURI = "https://v2api.heyyzu.bingluen.tw";
const request = require('request');

function v2Getter(path) {
  return new Promise((resolve, reject) => {
    let dataStream = "";
    request
      .get(rootURI + path)
      .on('response', (response) => {
        let httpStatus = response.statusCode;
        response
          .on('data', (data) => {
            dataStream += data;
          })
          .on('end', () => {
            let result = JSON.parse(dataStream);
            result.httpStatus = httpStatus;
            resolve(result);
          })
      });
  });
}

function v2Poster(path, formData) {
  return new Promise((resolve, reject) => {
    let dataStream = ""
    request
      .post(rootURI + path)
      .form(formData)
      .on('response', (response) => {
        let httpStatus = response.statusCode;
        response
          .on('data', (data) => {
            dataStream += data;
          })
          .on('end', () => {
            let result = JSON.parse(dataStream);
            result.httpStatus = httpStatus;
            resolve(result);
          })
      });
  });
}

function v2Deleteler(path, formData) {
  return new Promise((resolve, reject) => {
    let dataStream = ""
    request
      .delete(rootURI + path)
      .form(formData)
      .on('response', (response) => {
        let httpStatus = response.statusCode;
        response
          .on('data', (data) => {
            dataStream += data;
          })
          .on('end', () => {
            let result = JSON.parse(dataStream);
            result.httpStatus = httpStatus;
            resolve(result);
          })
      });
  });
}

module.exports = {
  login: (data) => {
    return v2Poster('/v2/login/student', data);
  },
  tokenVerify: (data) => {
    return v2Poster('/v2/verifyToken', data);
  },
  courseInfo: (data) => {
    return v2Poster('/v2/course/info', data);
  },
  courseHomework: (data) => {
    return v2Poster('/v2/course/homework', data);
  },
  courseAttachments: (attachmentId) => {
    return v2Getter('/v2/course/attachments/' + attachmentId);
  },
  courseNotice: (data) => {
    return v2Poster('/v2/course/notice', data);
  },
  courseMaterial: (data) => {
    return v2Poster('/v2/course/material', data);
  },
  courseHomeworkGrade: (data) => {
    return v2Poster('/v2/course/grade/homework', data);
  },
  userProfile: (data) => {
    return v2Poster('/v2/user/student/profile', data);
  },
  userCourse: (data) => {
    return v2Poster('/v2/user/student/course', data);
  },
  userRefreshCourse: (data) => {
    return v2Poster('/v2/user/student/refreshCourse', data);
  },
  libraryLoanRecord: (data) => {
    return v2Poster('/v2/library/loanRecord', data);
  },
  libraryGetCollection: (token) => {
    return v2Getter('/v2/library/collection?token=' + encodeURIComponent(token));
  },
  libraryAddCollection: (data) => {
    return v2Poster('/v2/library/collection', data);
  },
  libraryRemoveCollection: (data) => {
    return v2Deleteler('/v2/library/collection', data);
  },
}
