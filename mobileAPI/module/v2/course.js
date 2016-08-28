"use strict"

var pyCarriers = require(__mobileAPIBase + 'module/v2/pyCarriers');
var dbHelper = require(__mobileAPIBase + 'module/v2/dbHelper');
var user = require(__mobileAPIBase + 'module/v2/user');
var rsa = require(__mobileAPIBase + 'module/v2/rsa');
var fs = require('fs-extra');
var helper = require( __mobileAPIBase + 'module/v2/helper');
var user = require( __mobileAPIBase + 'module/v2/user');
var crypto = require('crypto');

module.exports.information = function(key, next) {
  var queryStatement = "";
  var queryParams = [];
  if (key.lesson_id && Number.isInteger(key.lesson_id)) {
    queryStatement = "SELECT courseName, "
    + "       lesson_id, "
    + "       courseCode, "
    + "       lessonTime, "
    + "       lessonClassroom "
    + "FROM "
    + "  (SELECT course_id, "
    + "          lesson_id, "
    + "          lessonTime, "
    + "          lessonClassroom "
    + "   FROM lesson "
    + "   WHERE lesson_id = ?) AS lesson "
    + "LEFT JOIN course ON lesson.course_id = course.course_id; ";
    queryParams.push(key.lesson_id);
  } else if (key.lesson_id && key.lesson_id instanceof Array) {
    queryStatement = "SELECT courseName, "
    + "       lesson_id, "
    + "       courseCode, "
    + "       lessonTime, "
    + "       lessonClassroom "
    + "FROM "
    + "  (";
    key.lesson_id.forEach(function(cv, i, arr) {
      queryParams.push(cv);
      queryStatement += "SELECT course_id, "
      + "       lesson_id, "
      + "       lessonTime, "
      + "       lessonClassroom "
      + "FROM lesson "
      + "WHERE lesson_id = ? "
      if (i < arr.length - 1) {
        queryStatement += " UNION "
      }
    })
    queryStatement += ") as lesson "
    + "LEFT JOIN course ON lesson.course_id = course.course_id; "
  } else if (key.user_uid && Number.isInteger(key.user_uid)) {
    queryStatement = "SELECT courseName, "
    + "       lesson_id, "
    + "       courseCode, "
    + "       lessonTime, "
    + "       lessonClassroom "
    + "FROM "
    + "  (SELECT course_id, "
    + "          lesson_id, "
    + "          lessonTime, "
    + "          lessonClassroom "
    + "   FROM lesson "
    + "   WHERE lessonYear = ? "
    + "     AND lessonSemester = ? "
    + "     AND lesson_id IN "
    + "       (SELECT lesson_id "
    + "        FROM student_lesson "
    + "        WHERE user_uid = ?)) AS lesson "
    + "LEFT JOIN course ON lesson.course_id = course.course_id; ";
    queryParams.push(key.year);
    queryParams.push(key.semester);
    queryParams.push(key.user_uid);
  } else {
    next({
      statusCode: 2101,
      status: 'Params illegal'
    });
  }

  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if (err) {
      next({
        isErr: true,
        statusCode: 2102,
        status: 'occure error when execute query',
        error: err,
        query: query.sql
      });
      return;
    } else {
      result.forEach(function(cv, i, arry) {
        cv.lessonClassroom = JSON.parse(cv.lessonClassroom);
      });
      next({
        statusCode: 200,
        status: 'query Succesful',
        data: result
      });
    }
  });

}

module.exports.homeworks = function(key, next) {
  var queryStatement = "";
  var queryParams = [];
  if (key.lesson_id && Number.isInteger(key.lesson_id)) {
    queryStatement = "SELECT homework_id, "
    + "       lesson_id, "
    + "       title, "
    + "       schedule, "
    + "       description, "
    + "       attachments.attach_id, "
    + "       portalFilename as filename, "
    + "       isGroup, "
    + "       freeSubmit, "
    + "       deadline "
    + "FROM homeworks LEFT JOIN attachments ON "
    + " homeworks.attach_id = attachments.attach_id "
    + "WHERE lesson_id = ?;"
    queryParams.push(key.lesson_id);
  } else if (key.lesson_id && key.lesson_id instanceof Array) {
    key.lesson_id.forEach(function(cv, i, arr) {
      queryParams.push(cv);
      queryStatement += "SELECT homework_id, "
      + "       lesson_id, "
      + "       title, "
      + "       schedule, "
      + "       description, "
      + "       attachments.attach_id, "
      + "       portalFilename as filename, "
      + "       isGroup, "
      + "       freeSubmit, "
      + "       deadline "
      + "FROM homeworks LEFT JOIN attachments ON "
      + " homeworks.attach_id = attachments.attach_id "
      + "WHERE lesson_id = ?"
      if (i < arr.length - 1) {
        queryStatement += " UNION "
      }
    })
    queryStatement += "; "
  } else if (key.user_uid && Number.isInteger(key.user_uid)) {
    queryStatement = "SELECT homework_id, "
    + "       lesson_id, "
    + "       title, "
    + "       schedule, "
    + "       description, "
    + "       attachments.attach_id, "
    + "       portalFilename as filename, "
    + "       isGroup, "
    + "       freeSubmit, "
    + "       deadline "
    + "FROM homeworks LEFT JOIN attachments ON "
    + " homeworks.attach_id = attachments.attach_id "
    + "WHERE EXISTS "
    + "    (SELECT 1 "
    + "     FROM "
    + "       (SELECT ul.lesson_id "
    + "        FROM "
    + "          (SELECT lesson_id "
    + "           FROM student_lesson "
    + "           WHERE user_uid = ?) AS ul "
    + "        LEFT JOIN lesson ON ul.lesson_id = lesson.lesson_id "
    + "        WHERE lessonYear = ? "
    + "          AND lessonSemester = ?) AS cul "
    + "     WHERE cul.lesson_id = homeworks.lesson_id) "
    + " AND homework_id > ?; "
    queryParams.push(key.user_uid);
    queryParams.push(key.year);
    queryParams.push(key.semester);
    queryParams.push(key.idAfter);
  } else {
    next({
      statusCode: 2101,
      status: 'Params illegal'
    });
  }

  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if (err) {
      next({
        isErr: true,
        statusCode: 2102,
        status: 'occure error when execute query',
        error: err,
        query: query.sql
      });
      return;
    } else {
      result.forEach((cv) => {
        cv.isGroup = cv.isGroup === 0 ? false : true;
        cv.freeSubmit = cv.freeSubmit === 0 ? false : true;
      })
      next({
        statusCode: 200,
        status: 'query Succesful',
        data: result.map((cv) => { cv.filename = decodeURIComponent(cv.filename); return cv; })
      });
    }
  });
}

module.exports.notices = function(key, next) {
  var queryStatement = "";
  var queryParams = [];
  if (key.lesson_id && Number.isInteger(key.lesson_id)) {
    queryStatement = "SELECT notice_id, "
    + "       lesson_id, "
    + "       title, "
    + "       author, "
    + "       content, "
    + "       attachments.attach_id, "
    + "       portalFilename as filename, "
    + "       date "
    + "FROM notices LEFT JOIN attachments ON "
    + " notices.attach_id = attachments.attach_id "
    + "WHERE lesson_id = ?;"
    queryParams.push(key.lesson_id);
  } else if (key.lesson_id && key.lesson_id instanceof Array) {
    key.lesson_id.forEach(function(cv, i, arr) {
      queryParams.push(cv);
      queryStatement += "SELECT notice_id, "
      + "       lesson_id, "
      + "       title, "
      + "       author, "
      + "       content, "
      + "       attachments.attach_id, "
      + "       portalFilename as filename, "
      + "       date "
      + "FROM notices LEFT JOIN attachments ON "
      + " notices.attach_id = attachments.attach_id "
      + "WHERE lesson_id = ? "
      if (i < arr.length - 1) {
        queryStatement += " UNION "
      }
    })
    queryStatement += "; "
  } else if (key.user_uid && Number.isInteger(key.user_uid)) {
    queryStatement = "SELECT notice_id, "
    + "       lesson_id, "
    + "       title, "
    + "       author, "
    + "       content, "
    + "       attachments.attach_id, "
    + "       portalFilename as filename, "
    + "       date "
    + "FROM notices LEFT JOIN attachments ON "
    + " notices.attach_id = attachments.attach_id "
    + "WHERE EXISTS "
    + "    (SELECT 1 "
    + "     FROM "
    + "       (SELECT ul.lesson_id "
    + "        FROM "
    + "          (SELECT lesson_id "
    + "           FROM student_lesson "
    + "           WHERE user_uid = ?) AS ul "
    + "        LEFT JOIN lesson ON ul.lesson_id = lesson.lesson_id "
    + "        WHERE lessonYear = ? "
    + "          AND lessonSemester = ?) AS cul "
    + "     WHERE cul.lesson_id = notices.lesson_id) "
    + " AND notice_id > ?; "
    queryParams.push(key.user_uid);
    queryParams.push(key.year);
    queryParams.push(key.semester);
    queryParams.push(key.idAfter);
  } else {
    next({
      statusCode: 2102,
      status: 'Params illegal'
    });
  }

  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if (err) {
      next({
        isErr: true,
        statusCode: 2102,
        status: 'occure error when execute query',
        error: err,
        query: query.sql
      });
      return;
    } else {
      next({
        statusCode: 200,
        status: 'query Succesful',
        data: result
      });
    }
  });
}

module.exports.materials = function(key, next) {
  var queryStatement = "";
  var queryParams = [];
  if (key.lesson_id && Number.isInteger(key.lesson_id)) {
    queryStatement = "SELECT material_id, "
    + "       lesson_id, "
    + "       schedule, "
    + "       outline, "
    + "       date, "
    + "       attachments.attach_id, "
    + "       portalFilename as filename, "
    + "       link, "
    + "       video "
    + "FROM materials LEFT JOIN attachments ON "
    + " materials.attach_id = attachments.attach_id "
    + "WHERE lesson_id = ?;"
    queryParams.push(key.lesson_id);
  } else if (key.lesson_id && key.lesson_id instanceof Array) {
    key.lesson_id.forEach(function(cv, i, arr) {
      queryParams.push(cv);
      queryStatement += "SELECT material_id, "
      + "       lesson_id, "
      + "       schedule, "
      + "       outline, "
      + "       date, "
      + "       attachments.attach_id, "
      + "       portalFilename as filename, "
      + "       link, "
      + "       video "
      + "FROM materials LEFT JOIN attachments ON "
      + " materials.attach_id = attachments.attach_id "
      + "WHERE lesson_id = ? "
      if (i < arr.length - 1) {
        queryStatement += " UNION "
      }
    })
    queryStatement += "; "
  } else if (key.user_uid && Number.isInteger(key.user_uid)) {
    queryStatement = "SELECT  material_id, "
    + "       lesson_id, "
    + "       schedule, "
    + "       outline, "
    + "       date, "
    + "       attachments.attach_id, "
    + "       portalFilename as filename, "
    + "       link, "
    + "       video "
    + "FROM materials LEFT JOIN attachments ON "
    + " materials.attach_id = attachments.attach_id "
    + "WHERE EXISTS "
    + "    (SELECT 1 "
    + "     FROM "
    + "       (SELECT ul.lesson_id "
    + "        FROM "
    + "          (SELECT lesson_id "
    + "           FROM student_lesson "
    + "           WHERE user_uid = ?) AS ul "
    + "        LEFT JOIN lesson ON ul.lesson_id = lesson.lesson_id "
    + "        WHERE lessonYear = ? "
    + "          AND lessonSemester = ?) AS cul "
    + "     WHERE cul.lesson_id = materials.lesson_id) "
    + " AND material_id > ?; "
    queryParams.push(key.user_uid);
    queryParams.push(key.year);
    queryParams.push(key.semester);
    queryParams.push(key.idAfter);
  } else {
    next({
      statusCode: 2101,
      status: 'Params illegal'
    });
  }

  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if (err) {
      next({
        isErr: true,
        statusCode: 2102,
        status: 'occure error when execute query',
        error: err,
        query: query.sql
      });
      return;
    } else {
      next({
        statusCode: 200,
        status: 'query Succesful',
        data: result
      });
    }
  });
}

module.exports.attachments = function(key, next) {
  if (!Number.isInteger(key.attach_id)) {
    next({
      isErr: true,
      statusCode: 2101,
      status: 'Params illegal',
    });
    return;
  } else {
    var queryStatement = "SELECT * FROM attachments WHERE attach_id = ?;";
    let task = new Promise((reslove) => {
      var query = dbHelper.query(queryStatement, [key.attach_id], (err, result, field) => {
        if (err) {
          reslove({
            isErr: true,
            statusCode: 2102,
            status: 'occure error when execute query',
            error: err,
            query: query.sql
          })
        } else {
          reslove({
            statusCode: 200,
            file: result[0]
          })
        }
      });
    });

    task.then((r) => {
      if (r.isErr) {
        console.error((new Date(Date.now())).toISOString(), 'module -> course -> attachments');
        console.error((new Date(Date.now())).toISOString(), r.error);
        console.error((new Date(Date.now())).toISOString(), r.query)
        next({
          isErr: true,
          statusCode: 2102,
          status: 'occure error when execute query'
        });
        return null;
      } else if(r.file.filename !== null) {
        next({
          statusCode: 200,
          originFilename: r.file.portalFilename,
          filename: r.file.filename
        });
        return null;
      } else {
        var getAttach = new Promise((reslove) => {
          pyCarriers({
            args: ['course', key.username, key.password, r.file.portalType < 3 ? 'getNoticeAttach' : 'getHWAttach', JSON.stringify({
              id: r.file.portalId,
              type: r.file.portalType,
              filename: r.file.portalFilename,
              path: __attachmentPath
            })],
          scriptFile: 'catalyst.py'}, (c) => {
            if (c.statusCode == 3200) {
              reslove({
                attach_id: r.file.attach_id,
                originFilename: r.file.portalFilename,
                filename: c.data
              });
            }
          });
        })
        return getAttach;
      }
    })
    .then((file) => {
      if (file == null) return null;
      var queryStatement = "UPDATE attachments SET filename = ? WHERE attach_id = ?";
      var query = dbHelper.query(queryStatement, [file.filename, file.attach_id], (err, result, field) => {
        if (err) {
          // ERROR
          console.error((new Date(Date.now())).toISOString(), 'module -> course -> attachments - UPDATE attachments Table');
          console.error((new Date(Date.now())).toISOString(), r.error);
          console.error((new Date(Date.now())).toISOString(), r.query)
          next({
            isErr: true,
            statusCode: 2102,
            status: 'occure error when execute query'
          });
        } else {
          next({
            statusCode: 200,
            originFilename: file.originFilename,
            filename: file.filename
          });
        }
      })
    })
    ;

  }
}

module.exports.isAllowRefresh = function(key, next) {
  var refreshTarget = key.refreshTarget === "messages" ? "messages_last_refresh_time"
   : key.refreshTarget === "homeworks" ? "homework_last_refresh_time"
   : key.refreshTarget === "materials" ? "material_last_refresh_time"
   : null
  ;

  if (!Number.isInteger(key.interval) || efreshTarget === null) {
    next(false);
    return;
  }

  var queryStatement = "";
  var queryParams = [];
  if (Number.isInteger(key.lesson_id)) {
    queryStatement += ""
    + "SELECT 1 FROM lesson_info_refresh WHERE lesson_id = ? AND "
    + "( "
    + " TIMESTAMPDIFF(SECOND, " + refreshTarget + ", NOW()) IS NULL "
    + " OR "
    + " TIMESTAMPDIFF(SECOND, " + refreshTarget + ", NOW()) < ? "
    + ") ;"
    queryParams = [key.lesson_id, key.interval];
  }
  else if (key.lesson_id instanceof Array) {
    key.lesson_id.forEach((cv, i, arr) => {
      if (Number.isInteger(cv)) {
        queryStatement += ""
        + "SELECT 1 as ? FROM lesson_info_refresh WHERE lesson_id = ? AND "
        + "( "
        + " TIMESTAMPDIFF(SECOND, " + refreshTarget + ", NOW()) IS NULL "
        + " OR "
        + " TIMESTAMPDIFF(SECOND, " + refreshTarget + ", NOW()) < ? "
        + ") ;";
        queryParams.push(cv);
        queryParams.push(key.interval);
      }
    });
  } else {
    next(false);
  }


  var query = dbHelper.query(queryStatement, queryParams, (err, result, field) => {
    if (err || result.length == 0) {
      console.error((new Date(Date.now())).toISOString(), "Database Error: module -> course -> isAllowRefresh.");
      console.error((new Date(Date.now())).toISOString(), err);
      console.error((new Date(Date.now())).toISOString(), query.sql);

      if (Number.isInteger(key.lesson_id))
      {
        next(false);
      }

      if (key.lesson_id instanceof Array)
      {
        next(key.lesson_id.reduce((pv, cv) => {
          pv[cv] = false;
          return pv;
        }, {}));
      }
    } else {

      if (Number.isInteger(key.lesson_id)) { next(true); }

      if (key.lesson_id instanceof Array)
      {
        next(result.reduce((pv, cv) => {
          for (var i in cv[0]) { pv[i] = cv[0][i]; }
          return pv;
        }, {}))
      }

    }
  });
}

module.exports.homeworkGrade = (key) => {
  var queryParams = []
  var queryStatement = "SELECT homework_id, grade, comment "
  + "FROM student_homeworks "
  + "WHERE user_uid = ? AND"
  + "   homework_id in (";
  queryParams.push(key.user_uid);
  key.homework_id.forEach((cv, i, arr) => {
    queryStatement += "?"
    queryParams.push(cv)
    if (i < arr.length - 1) {
      queryStatement += ", "
    }
  })
  queryStatement += ");"

  return new Promise((reslove, reject) => {
    var query = dbHelper.query(queryStatement, queryParams, (err, result, field) => {
      if (err) {
        reject({
          err: err,
          query: query
        });
      } else {
        reslove(result)
      }
    });
  });
}
