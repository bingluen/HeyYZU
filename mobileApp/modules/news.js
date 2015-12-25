var PyScript = require(__MobileAppBase + 'modules/runPython');
var Database = require(__MobileAppBase + 'modules/database');
var Tool = require(__MobileAppBase + 'modules/tool');

var getYearNow = Tool.getYearNow;
var getSemesterNow = Tool.getSemesterNow;

module.exports.catch = function(userData, next) {
  var args = [];
  args.push(userData.portalUsername)
  args.push(userData.portalPassword)

  var savingNews = function(news) {
    var queryStatment = "";
    var queryParams = [];
    queryStatment += "Create temporary Table TempNews ("
    queryStatment += "  unique_id_temp int(10) unsigned auto_increment,"
    queryStatment += "  page_id int(10) unsigned,"
    queryStatment += "  portal_uid int(10),"
    queryStatment += "  title varchar(200),"
    queryStatment += "  author varchar(200),"
    queryStatment += "  content text,"
    queryStatment += "  attach text,"
    queryStatment += "  date datetime,"
    queryStatment += "  primary key(unique_id_temp)"
    queryStatment += ");"

    for(i = 0 ; i < news.length; i++) {
      queryStatment += "INSERT INTO TempNews SET ?;"
    }

    queryParams = queryParams.concat(news.map(cv => ({
      page_id: cv.pageId,
      portal_uid: cv.portalId,
      author: cv.author,
      title: cv.title,
      content: cv.content,
      date: cv.date,
      attach: JSON.stringify(cv.attach)
    })));

    //renew notice_last_update list
    queryStatment += "INSERT INTO notice_last_update (course_unique_id) "
    queryStatment += "SELECT DISTINCT course_unique_id "
    queryStatment += "FROM usercourse "
    queryStatment += "WHERE course_unique_id NOT IN "
    queryStatment += "    (SELECT course_unique_id "
    queryStatment += "     FROM notice_last_update); "

    //renew notice_last_update refresh time
    queryStatment += "UPDATE notice_last_update "
    queryStatment += "SET update_time = CURRENT_TIMESTAMP "
    queryStatment += "WHERE course_unique_id IN "
    queryStatment += "    (SELECT DISTINCT course_unique_id "
    queryStatment += "     FROM relation_teacher_course "
    queryStatment += "     INNER JOIN usercourse ON relation_teacher_course.unique_id = usercourse.course_unique_id "
    queryStatment += "     WHERE (relation_teacher_course.year = ? "
    queryStatment += "            AND relation_teacher_course.semester = ? "
    queryStatment += "            AND usercourse.user_id = ?)); "
    queryParams.push(Tool.getYearNow());
    queryParams.push(Tool.getSemesterNow());
    queryParams.push(userData.id)

    // update news which is exists in database
    queryStatment += "UPDATE notice INNER JOIN TempNews ON notice.portal_uid = TempNews.portal_uid "
    queryStatment += "SET notice.title = TempNews.title, "
    queryStatment += "  notice.author = TempNews.author, "
    queryStatment += "  notice.content = TempNews.content, "
    queryStatment += "  notice.date = TempNews.date, "
    queryStatment += "  notice.attach = TempNews.attach "
    queryStatment += ";"

    // add new
    queryStatment += "INSERT INTO notice ("
    queryStatment += "  course_unique_id, portal_uid, title, content,"
    queryStatment += "  attach, author, date"
    queryStatment += ") "
    queryStatment += "SELECT "
    queryStatment += "  course_unique_id, portal_uid, title, content, attach, author, date "
    queryStatment += "FROM "
    queryStatment += "  (SELECT * FROM TempNews "
    queryStatment += "    WHERE TempNews.portal_uid "
    queryStatment += "    NOT IN "
    queryStatment += "    (SELECT portal_uid FROM notice) "
    queryStatment += "  ) as TN "
    queryStatment += " INNER JOIN "
    queryStatment += "  ("
    queryStatment += "    SELECT DISTINCT pageId, course_unique_id "
    queryStatment += "    FROM relation_teacher_course INNER JOIN usercourse "
    queryStatment += "    ON relation_teacher_course.unique_id = usercourse.course_unique_id "
    queryStatment += "    WHERE ("
    queryStatment += "      relation_teacher_course.year = ? "
    queryStatment += "      AND "
    queryStatment += "      relation_teacher_course.semester = ?"
    queryStatment += "    )"
    queryStatment += "  ) as UC "
    queryStatment += "ON TN.page_id =  UC.pageId ;"

    queryStatment += "DROP TABLE TempNews;"

    queryParams.push(Tool.getYearNow());
    queryParams.push(Tool.getSemesterNow());

    var query = Database.query(queryStatment, queryParams, function(err, result, field) {
      if(err) {
        next(err);
      } else {
        if (result[result.length - 2].affectedRows > 0)
        {
          console.log(result[result.length - 2].affectedRows, '則新通知需要被推播');
        }
        next();
      }
    });
  }

  PyScript({
    args: args,
    scriptFile: 'news.py',
  }, function(r) {
    if(r && r['status']['statusCode'] != 1001)
    {
      Logging.writeMessage('[Response][PythonError]['+ req.ip +']news Model ','access')
      res.status(500).json({
        state: 'InternalError',
        messages: 'Internal error',
        statusCode: 1002
      })
    } else {
      savingNews(r.result);
    }
  })
}

module.exports.getNews = function(userData, next) {
  var queryStatment = "SELECT notice.unique_id, notice.course_unique_id, title, content, attach, author, date FROM notice INNER JOIN usercourse ON usercourse.course_unique_id = notice.course_unique_id WHERE usercourse.user_id = ?"
  var queryParams = [];
  queryParams.push(userData.id);
  var query = Database.query(queryStatment, queryParams, function(err, result, field) {
    if(!err) {
      next(null, result)
    } else {
      next(err)
    }
  })
}

module.exports.getUpdateTime = function(userData, next) {
  var queryStatment = ""
  queryStatment += "SELECT course_unique_id, "
  queryStatment += "       update_time "
  queryStatment += "FROM notice_last_update "
  queryStatment += "WHERE course_unique_id IN "
  queryStatment += "    (SELECT DISTINCT course_unique_id "
  queryStatment += "     FROM relation_teacher_course "
  queryStatment += "     INNER JOIN usercourse ON relation_teacher_course.unique_id = usercourse.course_unique_id "
  queryStatment += "     WHERE (relation_teacher_course.year = ? "
  queryStatment += "            AND relation_teacher_course.semester = ? "
  queryStatment += "            AND usercourse.user_id = ?)); "
  var queryParams = []
  queryParams.push(Tool.getYearNow());
  queryParams.push(Tool.getSemesterNow());
  queryParams.push(userData.id);
  var query = Database.query(queryStatment, queryParams, function(err, result, field) {
    if(!err) {
      next(null, result);
    } else {
      next(err)
    }
  })
}
