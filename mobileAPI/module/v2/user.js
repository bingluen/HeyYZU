var pyCarriers = require(__mobileAPIBase + 'module/v2/pyCarriers');
var dbHelper = require( __mobileAPIBase + 'module/v2/dbHelper');

module.exports.updateCourseHistory = function(user, next) {
  next = next || (() => null);
  /* Step 1 get course history */
  pyCarriers({
    args: ['courseHistory', user.username, user.password],
    scriptFile: 'catalyst.py'
  }, function(r) {
    if(r.statusCode != 3400) {
      next({
        isErr: true,
        statusCode: r.statusCode,
        status: r.status
      });
      return;
    } else {
      update(r.data);
    }
  });

  /* Step 2 compare data and update */
  function update(data) {
    var queryStatement = ""
      + "Create temporary table userCourse ("
      + " code varchar(6),"
      + " year int(3) unsigned,"
      + " semester int(1) unsigned,"
      + " class varchar(4)"
      + ");"

    data.forEach(function(){
      queryStatement += "INSERT INTO userCourse SET ?;"
    });

    queryStatement += "DELETE FROM student_lesson Where not exists (SELECT * FROM (select * from userCourse join lesson on courseCode = code and lessonYear = year and lessonSemester = semester and lessonClass = class) as uc WHERE uc.lesson_id = student_lesson.lesson_id and student_lesson.user_uid = ?) AND user_uid = ?;"
    queryStatement += "INSERT INTO student_lesson (user_uid, lesson_id) SELECT ? as user_uid, lesson_id FROM (select * from userCourse join lesson on courseCode = code and lessonYear = year and lessonSemester = semester and lessonClass = class) as uc Where not exists (SELECT * FROM student_lesson WHERE student_lesson.user_uid = ? and student_lesson.lesson_id = uc.lesson_id);";
    queryStatement += "DROP TABLE userCourse;"

    var query = dbHelper.query(queryStatement, data.concat([user.id, user.id, user.id, user.id]), function(err, result, field) {
      if (err) {
        console.error((new Date(Date.now())).toISOString(), err);
        console.error((new Date(Date.now())).toISOString(), query);
        next({
          isErr: true,
          statusCode: 2202,
          status: 'Occure error when execute query.'
        });
      } else {
        next({
          statusCode: 200,
          status: 'Course history update successful !',
          addRow: result[result.length - 2].affectedRows,
          deleteRow: result[result.length - 3].affectedRows
        });
      }
    });
  }
}

module.exports.studentProfile = function(user_id, next) {
  var queryStatement = "SELECT * FROM student WHERE user_uid = ?;";
  var queryParams = [];
  queryParams.push(user_id);
  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if(err) {
      next({
        isErr: true,
        status: 2202,
        status: 'occure error when execute query.',
        error: err,
        query: query.sql
      })
    } else {
      next({
        statusCode: 200,
        status: 'get student profile successful.',
        data: result[0]
      });
    }
  });
}

module.exports.studentCourse = function(user_id, next) {
  var queryStatement = "Select lesson_id From student_lesson Where user_uid = ?;";
  var queryParams = [user_id];

  var query = dbHelper.query(queryStatement, queryParams, function(err, result, field) {
    if (err) {
      next({
        isErr: true,
        statusCode: 2202,
        status: 'occure error when execute query.',
        error: err,
        query: query.sql
      })
    }  else {
      next({
        status: 'get student course successful.',
        data: result
      });
    }
  });
}

module.exports.isAllowRefreshCourse = function(uid, next) {
  var queryStatement = ""
  + "SELECT TIMESTAMPDIFF(SECOND, last_refresh_time, NOW()) > 86400 AS isAllow "
  + "FROM student_lesson_refresh "
  + "WHERE user_uid = ?; "
  + "INSERT INTO student_lesson_refresh "
  + "VALUES (?, "
  + "        now()) ON DUPLICATE KEY "
  + "UPDATE last_refresh_time = CASE "
  + "                               WHEN TIMESTAMPDIFF(SECOND, last_refresh_time, NOW()) > 86400 THEN NOW() "
  + "                               ELSE last_refresh_time "
  + "                           END; "
  ;
  var query = dbHelper.query(queryStatement, [uid, uid], (err, result, field) => {
    if (err) {
      console.error((new Date(Date.now())).toISOString(), err);
      console.error((new Date(Date.now())).toISOString(), query);
      next(false);
    } else {
      if (result[0].length === 0) {
        next(true);
      } else {
        next((result[0][0]['isAllow'] === 0 ? false : true));
      }
    }
  })
}
