var PyScript = require(__MobileAppBase + 'modules/runPython');
var Database = require(__MobileAppBase + 'modules/database');


var getYearNow = function()
{
  var nowTime = new Date(Date.now());
  var year = nowTime.getYear() - 11;
  if(year <= 7) return year - 1;
  else return year;
}

var getSemesterNow = function()
{
  var nowTime = new Date(Date.now());
  var month = nowTime.getMonth();

  if(month <= 7 && month >= 2) return 2;
  else return 1;
}

var lessonToTime = function(lesson)
{
  lesson %= 100;
  switch(lesson) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
      return lesson + 7;
    case 11:
    case 12:
    case 13:
      return lesson + 7.5;

  }
}

var lessonToDay = function(lesson)
{
  return Math.round(lesson/100);
}

module.exports.getCourseHistory = function(userData, next) {

  // get courses
  var getCourses = function(userData) {
    var args = []
    args.push('getCourseHistory')
    args.push(userData.portalUsername)
    args.push(userData.portalPassword)

    PyScript({
      args: args,
      scriptFile: 'homework.py',
    }, function(r) {
      savingCourses(r, userData);
    })
  }

  // Saving course
  var savingCourses = function(courses, userData) {

    var queryStatment = "";

    //crate temporary table
    queryStatment += "Create temporary table userCourseTemp ("
    +  "temp_id int(10) auto_increment,"
    +  "code varchar(10),"
    +  "semester int(2),"
    +  "class varchar(5),"
    +  "year int(4),"
    +  "pageId int(5),"
    +  "primary key(temp_id)"
    + ");";
    // Insert user data
    for(i = 0; i < courses.length; i++)
      queryStatment += "INSERT INTO userCourseTemp SET ?;"

    queryStatment += "INSERT INTO userCourse (user_id, course_unique_id, pageId) "

    //Inner Join to get course_id
    queryStatment += "Select " + Database.escape(userData.id) + " as user_id, rtc.unique_id as course_unique_id, uc.pageId as pageId from "
    queryStatment += "(SELECT courses.course_id, userCourseTemp.semester, userCourseTemp.class, userCourseTemp.year, userCourseTemp.pageId FROM (userCourseTemp INNER JOIN courses ON userCourseTemp.code = courses.code)) as uc "
    queryStatment += "INNER JOIN relation_teacher_course AS rtc "
    queryStatment += "ON (uc.course_id = rtc.course_id and uc.year = rtc.year and uc.semester = rtc.semester and uc.class = rtc.class) "

    //drop course which has been exists in database
    queryStatment += "Where not exists (SELECT * FROM userCourse Where user_id = "+ Database.escape(userData.id) +" and course_unique_id = rtc.unique_id);"

    //drop course which not exist in portal
    queryStatment += "DELETE FROM userCourse Where user_id = " + Database.escape(userData.id) + " and "
    queryStatment += "course_unique_id not in "
    queryStatment += "(SELECT course_unique_id from "
    queryStatment += "(SELECT courses.course_id, userCourseTemp.semester, userCourseTemp.class, userCourseTemp.year FROM (userCourseTemp INNER JOIN courses ON userCourseTemp.code = courses.code)) as uc "
    queryStatment += "INNER JOIN relation_teacher_course AS rtc "
    queryStatment += "ON (uc.course_id = rtc.course_id and uc.year = rtc.year and uc.semester = rtc.semester and uc.class = rtc.class) );"

    queryStatment += "Drop Table userCourseTemp;"

    var query = Database.query(queryStatment, courses, function(err, result, field) {
      if(!err)
      {
        next(true)
      } else {
        next(false)
        console.log('error:', err)
      }
    })
  }

  getCourses(userData)
}

module.exports.getCurrentCourse = function(userData, next) {
  var queryStatment = "";

  queryStatment += "SELECT relation_teacher_course.unique_id, courses.cname, relation_teacher_course.classroom FROM "
  queryStatment += "courses INNER JOIN relation_teacher_course ON courses.course_id = relation_teacher_course.course_id "
  queryStatment += "Where "
  queryStatment += "(relation_teacher_course.unique_id in (SELECT course_unique_id FROM userCourse Where user_id = ?) and relation_teacher_course.year = ? and relation_teacher_course.semester = ?);"

  query = Database.query(queryStatment, [userData.id, getYearNow(), getSemesterNow()], function(err, result, field) {
    if(!err) {
      if (result.length > 0) {
        var currentCourse = [];
        for(i = 0; i < result.length; i++)
        {

          try {
            classroom = JSON.parse(result[i].classroom.replace(/\'/g, "\""))

            for(j in classroom)
            {
              var row = {
                classid: result[i].unique_id,
                name: result[i].cname,
                day: lessonToDay(j),
                start_time: lessonToTime(j),
                end_time: (lessonToTime(j)+1),
                location: classroom[j]
              }
              currentCourse.push(row)
            }
          } catch (err) {
          }
        }

        next(currentCourse)
      } else {
        next(null)
      }

    } else {
      console.log(err);
    }
  })

}

module.exports.getHomework = function(userData, next) {


  var getPageId = function(userData) {
    var queryStatment = "";
    queryStatment += "SELECT pageId "
    queryStatment += "FROM "
    queryStatment += "userCourse INNER JOIN relation_teacher_course "
    queryStatment += "ON "
    queryStatment += "course_unique_id = relation_teacher_course.unique_id "
    queryStatment += "WHERE user_id = ? and year = ? and semester = ?;"

    var query = Database.query(queryStatment, [userData.id, getYearNow(), getSemesterNow()], function(err, result, field) {
      if(err)
      {
        console.log(query.sql)
      } else {
        crawlerHomework(result)
      }
    });
  }

  var crawlerHomework = function(pageIdList) {
    var args = []
    args.push('getHomework')
    args.push(userData.portalUsername)
    args.push(userData.portalPassword)
    for(var i = 0; i < pageIdList.length; i++)
      args.push(pageIdList[i].pageId)

    PyScript({
      args: args,
      scriptFile: 'homework.py',
    }, function(r) {
      next(r);
    })
  }

  getPageId(userData)
}
