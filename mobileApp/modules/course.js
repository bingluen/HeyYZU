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

    queryStatment += "INSERT INTO usercourse (user_id, course_unique_id, pageId) "

    //Inner Join to get course_id
    queryStatment += "Select " + Database.escape(userData.id) + " as user_id, rtc.unique_id as course_unique_id, uc.pageId as pageId from "
    queryStatment += "(SELECT courses.course_id, userCourseTemp.semester, userCourseTemp.class, userCourseTemp.year, userCourseTemp.pageId FROM (userCourseTemp INNER JOIN courses ON userCourseTemp.code = courses.code)) as uc "
    queryStatment += "INNER JOIN relation_teacher_course AS rtc "
    queryStatment += "ON (uc.course_id = rtc.course_id and uc.year = rtc.year and uc.semester = rtc.semester and uc.class = rtc.class) "

    //drop course which has been exists in database
    queryStatment += "Where not exists (SELECT * FROM usercourse Where user_id = "+ Database.escape(userData.id) +" and course_unique_id = rtc.unique_id);"

    //drop course which not exist in portal
    queryStatment += "DELETE FROM usercourse Where user_id = " + Database.escape(userData.id) + " and "
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
  queryStatment += "(relation_teacher_course.unique_id in (SELECT course_unique_id FROM usercourse Where user_id = ?) and relation_teacher_course.year = ? and relation_teacher_course.semester = ?);"

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

  var userCourseDetail, ToDoList;

  var getUserCourseDetail = function() {
    var queryStatment = "";
    queryStatment += "SELECT "
    queryStatment += "code, cname, course_unique_id, year, semester, class, pageId "
    queryStatment += "FROM courses "
    queryStatment += "NATURAL JOIN "
    queryStatment += "(SELECT "
    queryStatment += "course_id, course_unique_id, year, semester, class, pageId "
    queryStatment += "FROM "
    queryStatment += "usercourse INNER JOIN relation_teacher_course "
    queryStatment += "ON "
    queryStatment += "course_unique_id = relation_teacher_course.unique_id "
    queryStatment += "WHERE user_id = ? and year = ? and semester = ?) as a "
    queryStatment += ";"

    var query = Database.query(queryStatment, [userData.id, getYearNow(), getSemesterNow()], function(err, result, field) {
      if(err)
      {
        console.log('Error:', err, query.sql)
      } else {
        userCourseDetail = result
        if(!userData.newUserFlag)
        {
          checkToDoList();
        } else {
          crawlerHomework(userCourseDetail.map(cv => cv.pageId));
        }
      }
    });
  }

  var checkToDoList = function() {
    var args = []
    args.push('checkNewHomework')
    args.push(userData.portalUsername)
    args.push(userData.portalPassword)

    PyScript({
      args: args,
      scriptFile: 'homework.py',
    }, function(r) {
      ToDoList = r;
      checkDatabase();
    })
  }

  var checkDatabase = function() {

    //Todo list Inner Join userCourse
    ToDoList = ToDoList.map(function(cv) {
      course = userCourseDetail.filter(function(c) {
        return c.code == cv.code;
      })[0]

      cv.course_unique_id = course.course_unique_id
      cv.pageId = course.pageId

      return cv;
    })

    var queryStatment = "";
    var queryParams = []

    //add the homework which is in `homeworks` but user not get
    queryStatment += "INSERT INTO userhomework (user_id, homework_unique_id) "
    queryStatment += "SELECT "+ Database.escape(userData.id) +", unique_id "
    queryStatment += "FROM homeworks "
    queryStatment += "WHERE course_unique_id IN"
    queryStatment += "    ( SELECT course_unique_id"
    queryStatment += "     FROM usercourse"
    queryStatment += "     WHERE user_id = "+ Database.escape(userData.id) +")"
    queryStatment += "  AND unique_id NOT IN"
    queryStatment += "    (SELECT homework_unique_id"
    queryStatment += "     FROM userhomework"
    queryStatment += "     WHERE user_id = "+ Database.escape(userData.id) +");"

    for(var i = 0; i < ToDoList.length; i++)
    {
      queryStatment += "SELECT ? as course_unique_id, ? as pageId, count(*) as hw FROM homeworks WHERE course_unique_id = ? and title LIKE ?;"
      queryParams.push(ToDoList[i].course_unique_id)
      queryParams.push(ToDoList[i].pageId)
      queryParams.push(ToDoList[i].course_unique_id)
      queryParams.push(ToDoList[i].title)
    }

    //check status of homework which update time is over 24 hours
    queryStatment += "SELECT distinct(pageId) "
    queryStatment += "FROM usercourse "
    queryStatment += "INNER JOIN "
    queryStatment += "  (SELECT course_unique_id "
    queryStatment += "   FROM userhomework "
    queryStatment += "   INNER JOIN homeworks ON homeworks.unique_id = userhomework.homework_unique_id "
    queryStatment += "   WHERE ((uploadfile IS NULL "
    queryStatment += "           OR (uploadfile LIKE 'null' "
    queryStatment += "               AND user_id = ? "
    queryStatment += "               AND HOUR(timediff(now(), updatetime)) > 24)) "
    queryStatment += "          AND deadline >= curdate())) AS hw ON usercourse.course_unique_id = hw.course_unique_id; "
    queryParams.push(userData.id)

    var pageIdList = []

    query = Database.query(queryStatment, queryParams, function(err, r, field) {
      if(!err)
      {
        for(var i = 1; i < r.length - 1; i++)
        {
          if(r[i][0].hw == 0 && pageIdList.indexOf(r[i][0].pageId) < 0)
          {
            pageIdList.push(r[i][0].pageId)
          }
        }

        pageIdList = pageIdList.concat(r[r.length - 1].filter( cv => (pageIdList.indexOf(cv.pageId) < 0)).map(cv => cv.pageId));

        if (pageIdList.length > 0)
        {
          crawlerHomework(pageIdList);
        } else {
          fetchHomework();
        }
      } else {
        console.log("Error: ", err, query.sql);
      }
    });

  }

  var crawlerHomework = function(pageIdList) {

    var args = []
    args.push('getHomework')
    args.push(userData.portalUsername)
    args.push(userData.portalPassword)
    args = args.concat(pageIdList)

    PyScript({
      args: args,
      scriptFile: 'homework.py',
    }, function(r) {
      savingHomework(r.map(function(cv) {
        cv.course_unique_id = userCourseDetail.filter(u => u.pageId == cv.pageId)[0].course_unique_id

        return cv
      }));
    })
  }

  var savingHomework = function(hw) {

    var queryStatment = ""
    var queryParams = []
    queryStatment += "create temporary table homeworksTemp ("
    queryStatment += "  unique_id_TEMP int(50) unsigned auto_increment,"
    queryStatment += "  course_unique_id int(20) unsigned zerofill not null,"
    queryStatment += "  portalHwId int(5) unsigned not null,"
    queryStatment += "  title varchar(200) not null,"
    queryStatment += "  schedule varchar(200),"
    queryStatment += "  description text,"
    queryStatment += "  attach text,"
    queryStatment += "  isGroup tinyint(1) not null,"
    queryStatment += "  freeSubmit tinyint(1) not null,"
    queryStatment += "  deadline datetime,"
    queryStatment += "  uploadFile text,"
    queryStatment += "  grade int(2),"
    queryStatment += "  comment text,"
    queryStatment += "  user_id int(11) unsigned zerofill, "
    queryStatment += "  primary key(unique_id_TEMP)"
    queryStatment += ");"

    for(i = 0 ; i < hw.length; i++) {
      queryStatment += "INSERT INTO homeworksTemp SET ?;"
    }

    queryParams = queryParams.concat(hw.map(cv => ({
      user_id: userData.id,
      course_unique_id: cv.course_unique_id,
      portalHwId: cv.wk_id,
      title: cv.title,
      schedule: cv.schedule,
      description: cv.description,
      isGroup: cv.isGroup == true ? 1 : 0,
      freeSubmit: cv.freeSubmit == true ? 1: 0,
      deadline: cv.deadline,
      attach: JSON.stringify(cv.attach),
      uploadFile: JSON.stringify(cv.uploadFile),
      grade: cv.grade,
      comment: cv.comment
    })));

    //UPDATE homework which has existed in `homeworks` table
    queryStatment += "UPDATE homeworksTemp INNER JOIN homeworks ON "
    queryStatment += "homeworks.course_unique_id = homeworksTemp.course_unique_id and "
    queryStatment += "homeworks.portalHwId = homeworksTemp.portalHwId "
    queryStatment += "SET "
    queryStatment += "homeworks.title = homeworksTemp.title, "
    queryStatment += "homeworks.schedule = homeworksTemp.schedule, "
    queryStatment += "homeworks.description = homeworksTemp.description, "
    queryStatment += "homeworks.isGroup = homeworksTemp.isGroup, "
    queryStatment += "homeworks.freeSubmit = homeworksTemp.freeSubmit, "
    queryStatment += "homeworks.deadline = homeworksTemp.deadline, "
    queryStatment += "homeworks.attach = homeworksTemp.attach,"
    queryStatment += "homeworks.pushed = 1"
    queryStatment += ";"

    //Insert homeworks which has not existed in `homeworks` table
    queryStatment += "INSERT INTO homeworks (course_unique_id, portalhwid, title, schedule, description, isgroup, freesubmit, deadline, attach) "
    queryStatment += "SELECT course_unique_id, portalHwId, title, schedule, description, isGroup, freeSubmit, deadline, attach "
    queryStatment += "FROM homeworksTemp "
    queryStatment += "WHERE not exists "
    queryStatment += " (SELECT * FROM homeworks "
    queryStatment += "  WHERE course_unique_id = homeworksTemp.course_unique_id and "
    queryStatment += "    portalHwId = homeworksTemp.portalHwId"
    queryStatment += ");"


    //UPDATA Homework which has existed in `userHomeworks` table
    queryStatment += "UPDATE userhomework "
    queryStatment += "INNER JOIN"
    queryStatment += "(SELECT user_id, unique_id, uploadFile, grade, comment from homeworksTemp INNER JOIN homeworks ON "
    queryStatment += "homeworks.course_unique_id = homeworksTemp.course_unique_id and "
    queryStatment += "homeworks.portalHwId = homeworksTemp.portalHwId) as hw "
    queryStatment += "ON userhomework.homework_unique_id = hw.unique_id and "
    queryStatment += "hw.user_id = userhomework.user_id "
    queryStatment += "SET "
    queryStatment += "userhomework.uploadFile = hw.uploadFile, "
    queryStatment += "userhomework.grade = hw.grade, "
    queryStatment += "userhomework.comment = hw.comment"
    queryStatment += ";"

    //Insert Homework which has not existed in `userHomeworks` table
    queryStatment += "INSERT INTO userhomework (homework_unique_id, user_id, uploadFile, grade, comment, updatetime) "
    queryStatment += "SELECT homeworks.unique_id as homework_unique_id, homeworksTemp.user_id, homeworksTemp.uploadFile, homeworksTemp.grade, homeworksTemp.comment, NOW() "
    queryStatment += "FROM "
    queryStatment += "homeworksTemp INNER JOIN homeworks ON "
    queryStatment += "homeworks.course_unique_id = homeworksTemp.course_unique_id and "
    queryStatment += "homeworks.portalHwId = homeworksTemp.portalHwId "
    queryStatment += "WHERE not exists "
    queryStatment += "(SELECT * FROM userhomework WHERE user_id = homeworksTemp.user_id and homework_unique_id = homeworks.unique_id);"

    queryStatment += "DROP TABLE homeworksTemp;"

    query = Database.query(queryStatment, queryParams, function(err, result, field) {
      if(err) {
        console.log('Error: ', err, query.sql);
      } else {
        if(result[result.length - 5].changedRows > 0)
          console.log(result[result.length - 5].changedRows, '部分作業內容已經更動')
        if(result[result.length - 4].affectedRows > 0)
          console.log(result[result.length - 4].affectedRows, '作業新增進行推播')

        fetchHomework();
      }
    })
  }

  var fetchHomework = function() {
    var queryStatment = ""
    queryStatment += "SELECT homeworks.unique_id AS hw_uid, "
    queryStatment += "       homeworks.course_unique_id, "
    queryStatment += "       homeworks.title, "
    queryStatment += "       homeworks.schedule, "
    queryStatment += "       homeworks.description, "
    queryStatment += "       homeworks.attach, "
    queryStatment += "       homeworks.isgroup, "
    queryStatment += "       homeworks.freesubmit, "
    queryStatment += "       homeworks.deadline, "
    queryStatment += "       userhomework.unique_id AS user_hw_uid, "
    queryStatment += "       userhomework.uploadFile, "
    queryStatment += "       userhomework.grade, "
    queryStatment += "       userhomework.comment "
    queryStatment += "FROM homeworks "
    queryStatment += "INNER JOIN userhomework ON homeworks.unique_id = userhomework.homework_unique_id "
    queryStatment += "WHERE userhomework.user_id = ? "
    var queryParams = []
    queryParams.push(userData.id)
    query = Database.query(queryStatment, queryParams, function(err, result, field) {
      if(!err)
      {
        result.map(function(cv) {
          try {
            cv.attach = JSON.parse(cv.attach);
          } catch(e) {
            cv.attach = null;
          }
          try {
            cv.uploadFile = JSON.parse(cv.uploadFile);
          } catch(e) {
            cv.uploadFile = null;
          }
          return cv;
        })
        next(result)
      } else {
        console.log("ERROR: ", err, query.sql);
      }
    })
  }

  getUserCourseDetail()
}
