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
      .json(formData)
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
    return v2Poster('/v2/course/homework', data).then((resolve) => {
      let homeworkIds = resolve.data
        .reduce((pv, cv) => {
          pv.push(cv.homework_id);
          return pv;
        }, []);

      return v2Poster('/v2/course/grade/homework', {
        token: data.token,
        id: homeworkIds
      }).then((gradeResult) => {
        try {
          gradeResult = gradeResult.result;
          resolve.data = resolve.data.map((cv) => {
            let grade = gradeResult.filter((grade) => (grade.homework_id == cv.homework_id))[0];
            cv.grade = grade.grade;
            cv.comment = grade.comment;
            let deadline = new Date(cv.deadline)
            deadline.setSeconds(deadline.getSeconds() + 60 * 60 * 24 - 1);
            cv.deadline = deadline.toISOString();
            return cv;
          });
          return resolve;
        } catch (e) {
          return resolve;
        }
      }, (reject) => { console.log(reject) });

    });
  },
  courseNotice: (data) => {
    return v2Poster('/v2/course/notice', data).then((resolve) => {
      resolve.data = resolve.data.map((cv) => {
        cv.date = (new Date(cv.date)).toISOString();
        return cv;
      });
      return resolve;
    });
  },
  courseMaterial: (data) => {
    return v2Poster('/v2/course/material', data).then((resolve) => {
      resolve.data = resolve.data.map((cv) => {
        cv.date = (new Date(cv.date)).toISOString();
        return cv;
      });
      return resolve;
    });
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