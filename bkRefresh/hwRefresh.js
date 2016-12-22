var dbHelper = require( __mobileAPIBase + 'module/dbHelper');
var helper = require( __mobileAPIBase + 'module/helper');
var pyCarriers = require( __mobileAPIBase + 'module/pyCarriers');
var refreshLead = require(__refreshBase + 'refreshLead');

module.exports = (forcibly) => {

  var CURRENT_HOUR = helper.getCurrentHour();
  var CURRENT_DAY = helper.getCurrentDay();

  if (!forcibly && (CURRENT_HOUR < 8 || CURRENT_HOUR > 20)) return Promise.reject();

  console.log(
    "[hwRefresh]",
    (new Date(Date.now())).toISOString(),
    "執行作業資料庫更新"
  );

  var query = ""
  + "  SELECT user_uid, student_lesson.lesson_id, courseCode, lessonYear, lessonSemester, lessonClass "
  + "   FROM student_lesson LEFT JOIN lesson "
  + "      ON student_lesson.lesson_id = lesson.lesson_id "
  + "   WHERE lessonYear = ? AND lessonSemester = ?;";
  var params = [helper.getYearNow(), helper.getSemesterNow()];

  var task = new Promise((resolve, reject) => {
    console.log(
      "[hwRefresh]",
      (new Date(Date.now())).toISOString(),
      "取出課程清單"
    );
    var qs = dbHelper.query(query, params, (err, result, field) => {
      if (err) {
        console.error(
          "[hwRefresh]",
          (new Date(Date.now())).toISOString(),
          err
        );
        console.error(
          "[hwRefresh]",
          (new Date(Date.now())).toISOString(),
          qs.sql
        );
        reject();
      } else {
        resolve(result);
      }
    });
  })
  .then(
    (resolve) => {
      console.log(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
        "課程清單取出完成"
      );
      //重新包裝
      var refreshList = resolve.map((cv) => {
          return {
            lesson: {
              lesson_id: cv.lesson_id,
              courseCode: cv.courseCode,
              lessonYear: cv.lessonYear,
              lessonSemester: cv.lessonSemester,
              lessonClass: cv.lessonClass
            },
            user_uid: cv.user_uid
          }
        })
      ;
      //把更新清單，以user_uid做分群。
      var taskPackage = refreshList.reduce((pv, cv, i) => {
        if (pv.indexOf(cv.user_uid) < 0) pv.push(cv.user_uid);
        return pv;
      }, [])
        .map((cv, i, arr) => ({
            user_uid: cv,
            lesson: refreshList.reduce((pv, c, i) => {
              if (c.user_uid == cv) pv.push(c.lesson);
              return pv;
            }, [])
          })
        )
      ;
      return homeworkRefresh(taskPackage)
    },
    (reject) => {
      console.log(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
        "課程清單取出失敗"
      );
      return Promise.reject();
    }
  )
  return task;
}

function homeworkRefresh(taskPackage) {
  /**
   * 分幾個步驟
   * 1 -> look up portal username & password
   * 2 -> 登入
   * 2-1 -> 登入失敗，註銷該 User token
   * 2-2 -> 登入成功，該 user 包入 taskPackage
   * 3 -> 對所有 taskPackage 爬蟲
   * 4 -> 根據爬蟲結果處理
   */

  return refreshLead(taskPackage)
  .then((resolveTask) => {
    console.log(
      "[hwRefresh]",
      (new Date(Date.now())).toISOString(),
      "更新前置作業完成."
    );
    if (resolveTask.length > 0) {
      return crawler(resolveTask);
    } else {
      return Promise.reject(true);
    }

  },
  (rejectTask) => {
    console.error(
      "[hwRefresh]",
      (new Date(Date.now())).toISOString(),
       "更新前置作業失敗."
     );
     console.error(
       "[hwRefresh]",
       (new Date(Date.now())).toISOString(),
        rejectTask
      );
  })
  .then(
    (resolveTask) => {
      console.log(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
        "Crawler 執行完畢."
      );
      return refreshDB(resolveTask);
    },
    (rejectTask) => {
      if (rejectTask === true) {
        console.log(
          "[hwRefresh]",
          (new Date(Date.now())).toISOString(),
          "可用 User 為空，中斷更新。"
        );
      } else {
        console.error(
          "[hwRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask
        )
        console.error(
          "[hwRefresh]",
          (new Date(Date.now())).toISOString(),
          "Crawler 失敗."
        );
      }
    }
  )
  .then(
    (resolveTask) => {
      console.log(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
        "資料庫更新完畢."
      )
      return Promise.resolve();
    },
    (rejectTask) => {
      console.error(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
         "資料庫更新 失敗."
      );
      console.error(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
        rejectTask.err
      );
      console.error(
        "[hwRefresh]",
        (new Date(Date.now())).toISOString(),
        rejectTask.sql
      );
      return Promise.reject();
    }
  )


}

function crawler(taskPackages) {
  var tasks = taskPackages.map(
    (cv) => ({
      user_uid: cv.user_uid,
      username: cv.portalUsername,
      password: cv.portalPassword,
      lessons: cv.lesson.map(
        (v) => ({
          courseCode: v.courseCode,
          year: v.lessonYear,
          semester: v.lessonSemester,
          class: v.lessonClass
        })
      )
    })
  );

  var lessonDB = taskPackages.reduce((pv, cv, i, arr) => {
    pv = pv.concat(cv.lesson)
    return pv;
  }, []);

  tasks = tasks.map(
    (cv) => {
      return new Promise((solve, unsolve) => {
        pyCarriers({
          args: [
            'course',
            cv.username,
            cv.password,
            'homework',
            JSON.stringify(cv.lessons)
          ],
          scriptFile: 'catalyst.py'},
          (r) => {
            if (r.statusCode != 3100) {
              console.error(
                "[hwRefresh]",
                (new Date(Date.now())).toISOString(),
                 "爬蟲登入 失敗.",
                 r.statusCode,
                 r.status
               );
               unsolve();
            } else {
              var data = r.data.filter((vv) => (vv.statusCode == 3200))
                .map((v, i , arr) => ({
                  user_uid: cv.user_uid,
                  lesson_id: lessonDB.filter(
                    (r) => (
                      v.courseCode == r.courseCode
                      && v.year == r.lessonYear
                      && v.semester == r.lessonSemester
                      && v.class == r.lessonClass
                    )
                  )[0].lesson_id,
                  homeworks: v.homework
                }))
              ;
              solve(data);
            }
          }
        );
      })
    }
  );

  return Promise.all(tasks)
}

function refreshDB(data) {
  return new Promise((resolve, reject) => {
    /*e
      Insert into database
     */
    var queryStatement = "";
    var queryParams = [];
    data.forEach((people, i, arr) => {
      people.forEach((cv, i , arr) => {
        queryStatement += "INSERT INTO student_homework_refresh (user_uid, lesson_id, last_refresh_time) "
        + "VALUES ";
        queryStatement += "(?, ?, NOW()) ON DUPLICATE KEY "
        + "UPDATE last_refresh_time = NOW() ;";
        queryParams.push(cv.user_uid);
        queryParams.push(cv.lesson_id);
      })
    });

    queryStatement += "CREATE TEMPORARY TABLE IF NOT EXISTS fetch_homeworks ( "
    + "  user_uid int(30) unsigned, "
    + "  lesson_id int(10) unsigned,  "
    + "  wkId int(3) unsigned,  "
    + "  title varchar(200),  "
    + "  schedule varchar(200),  "
    + "  description text,  "
    + "  attach_id int(30) unsigned,  "
    + "  isGroup tinyint(1), "
    + "  freeSubmit tinyint(1), "
    + "  deadline datetime,  "
    + "  attachPortalId int(10) unsigned,  "
    + "  attachPortalType tinyint(2) unsigned, "
    + "  attachPortalFilename varchar(200), "
    + "  grade int(4), "
    + "  comment text, "
    + "  homework_id int(30) unsigned "
    + "); "

    data.forEach((cv, i, arr) => {
      cv.forEach((user) => {
        user.homeworks.forEach((hw, j, darr) => {
          queryStatement += "INSERT INTO fetch_homeworks SET ? ;"
          queryParams.push({
            user_uid: user.user_uid,
            lesson_id: user.lesson_id,
            wkId: hw.wk_id,
            title: hw.title,
            schedule: hw.schedule,
            description: hw.description,
            isGroup: hw.isGroup === false ? 0 : 1,
            freeSubmit: hw.freeSubmit === false ? 0 : 1,
            deadline: hw.deadline,
            attachPortalId: hw.attach === null ? null : hw.attach.id,
            attachPortalType: hw.attach === null ? null : hw.attach.type,
            attachPortalFilename: hw.attach === null ? null : hw.attach.filename,
            grade: hw.grade.length == 0 ? null : hw.grade,
            comment: hw.comment.length == 0 ? null : hw.comment
          });
        })
      })
    })

    //Attachment Insert
    queryStatement += "INSERT INTO attachments (portalId, portalType, portalFilename) "
    + "SELECT attachPortalId AS portalId, "
    + "   attachPortalType AS portalType, "
    + "   attachPortalFilename AS portalFilename "
    + "FROM fetch_homeworks "
    + "WHERE attachPortalId IS NOT NULL "
    + "  AND attachPortalType IS NOT NULL "
    + "  AND attachPortalFilename IS NOT NULL "
    + "GROUP BY portalId "
    + "ON DUPLICATE KEY UPDATE portalId=portalId;"

    //update Attachment id to homework
    + "UPDATE attachments INNER JOIN fetch_homeworks ON "
    + "  attachPortalId = portalId "
    + "  AND attachPortalFilename = portalFilename "
    + "SET fetch_homeworks.attach_id = attachments.attach_id;"

    //update homeworks
    + "UPDATE homeworks INNER JOIN fetch_homeworks ON "
    + "  homeworks.lesson_id = fetch_homeworks.lesson_id "
    + "  AND homeworks.wkId = fetch_homeworks.wkId "
    + "SET homeworks.title = fetch_homeworks.title, "
    + "  homeworks.schedule = fetch_homeworks.schedule, "
    + "  homeworks.description = fetch_homeworks.description, "
    + "  homeworks.attach_id = fetch_homeworks.attach_id, "
    + "  homeworks.isGroup = fetch_homeworks.isGroup, "
    + "  homeworks.freeSubmit = fetch_homeworks.freeSubmit, "
    + "  homeworks.deadline = fetch_homeworks.deadline "
    + "; "

    // Remove Null wkID
    + "DELETE FROM fetch_homeworks WHERE wkId IS NULL;"

    // Insert new homeworks
    + "REPLACE INTO homeworks (lesson_id, wkId, title, schedule, description, attach_id, isGroup, freeSubmit, deadline) SELECT lesson_id, wkId, title, schedule, description, attach_id, isGroup, freeSubmit, deadline FROM fetch_homeworks fh "
    + "WHERE NOT EXISTS (SELECT 1 FROM homeworks hw WHERE fh.lesson_id = hw.lesson_id AND fh.wkId = hw.wkId); "

    // renew homework id
    + "UPDATE fetch_homeworks INNER JOIN homeworks ON "
    + "  homeworks.lesson_id = fetch_homeworks.lesson_id "
    + "  AND homeworks.wkId = fetch_homeworks.wkId "
    + "SET fetch_homeworks.homework_id = homeworks.homework_id "
    + "; "

    // insert user homework
    + "INSERT INTO student_homeworks (user_uid, homework_id, grade, comment) "
    + "SELECT fh.user_uid, "
    + "   fh.homework_id, "
    + "   fh.grade, "
    + "   fh.comment "
    + "FROM fetch_homeworks fh "
    + "ON DUPLICATE KEY UPDATE grade=fh.grade, comment=fh.comment"
    + ";"

    + "DROP TABLE fetch_homeworks; "

    + "DELETE n1 FROM homeworks n1, homeworks n2 WHERE n1.homework_id > n2.homework_id AND n1.lesson_id = n2.lesson_id AND n1.wkId = n2.wkId;"

    var query = dbHelper.query(queryStatement, queryParams,
      (err, result) => {
        if(err) {
          reject({err: err, sql: query.sql});
        } else {
          resolve();
        }
      }
    )
  });
}
