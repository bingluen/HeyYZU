var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');
var dbHelper = require( __mobileAPIBase + 'module/dbHelper');

module.exports.updateCourseHistory = function(user, next) {
  next = next || () => null;
  /* Step 1 get course history */
  pyCarriers({
    args: ['courseHistory', user.username, user.password],
    scriptFile: 'catalyst.py'
  }, function(r) {
    if(r.statusCode != 200) {
      next({
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

    queryStatement += "DELETE FROM student_lesson Where not exists (SELECT * FROM (select * from userCourse join lesson on courseCode = code and lessonYear = year and lessonSemester = semester and lessonClass = class) as uc WHERE uc.lesson_id = student_lesson.lesson_id and student_lesson.user_uid = ?);"
    queryStatement += "INSERT INTO student_lesson (user_uid, lesson_id) SELECT ? as user_uid, lesson_id FROM (select * from userCourse join lesson on courseCode = code and lessonYear = year and lessonSemester = semester and lessonClass = class) as uc Where not exists (SELECT * FROM student_lesson WHERE student_lesson.user_uid = ? and student_lesson.lesson_id = uc.lesson_id);";

    var query = dbHelper.query(queryStatement, data.concat([user.id, user.id, user.id]), function(err, result, field) {
      if (err) { next(err) } else {
        next(null, {
          statusCode: 200,
          status: 'Course history update successful !',
          addRow: result[result.length - 1].affectedRows,
          deleteRow: result[result.length - 2].affectedRows
        });
      }
    });
  }
}
