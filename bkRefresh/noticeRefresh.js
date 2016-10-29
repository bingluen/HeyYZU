var dbHelper = require(__mobileAPIBase + 'module/dbHelper');
var helper = require(__mobileAPIBase + 'module/helper');
var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');
var refreshLead = require(__refreshBase + 'refreshLead');
var FCM = require(__mobileAPIBase + 'module/fcm');

module.exports = (next) => {
  console.log(
    "[noticeRefresh]",
    (new Date(Date.now())).toISOString(),
    "執行通知資料庫更新"
  );

  
  var query = ""
  + "  SELECT user_uid, student_lesson.lesson_id, courseCode, lessonYear, lessonSemester, lessonClass "
  + "   FROM student_lesson LEFT JOIN lesson "
  + "      ON student_lesson.lesson_id = lesson.lesson_id "
  + "   WHERE lessonYear = ? AND lessonSemester = ?;";
  var params = [helper.getYearNow(), helper.getSemesterNow()];

  var task = new Promise((resolve, reject) => {
      console.log(
        "[noticeRefresh]",
        (new Date(Date.now())).toISOString(),
        "取出課程清單"
      );
      var qs = dbHelper.query(query, params, (err, result, field) => {
        if (err) {
          console.error(
            "[noticeRefresh]",
            (new Date(Date.now())).toISOString(),
            err
          );
          console.error(
            "[noticeRefresh]",
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
          "[noticeRefresh]",
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
        });
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
          }));
        return noticeRefresh(taskPackage)
      },
      (reject) => {
        console.log(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "課程清單取出失敗"
        );
        return Promise.reject();
      }
    )
  return task;
}

function noticeRefresh(taskPackages) {
  /**
   * 分幾個步驟
   * 1 -> look up portal username & password
   * 2 -> 登入
   * 2-1 -> 登入失敗，註銷該 User token
   * 2-2 -> 登入成功，該 user 包入 taskPackage
   * 3-1 -> taskPackage 中每個課程只選一個 User 取最少 User
   * 3 -> 對所有 taskPackage 爬蟲
   * 4 -> 根據爬蟲結果處理
   */
  return refreshLead(taskPackages)
    .then((resolveTask) => {
        console.log(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "更新前置作業完成."
        );
        if (resolveTask.length > 0) {
          return filter(resolveTask);
        } else {
          return Promise.reject(true);
        }
      },
      (rejectTask) => {
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "更新前置作業失敗."
        );
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask
        );
      })
    .then(
      (resolveTask) => {
        return crawler(resolveTask);
      },
      (rejectTask) => {
        if (rejectTask === true) {
          console.log(
            "[noticeRefresh]",
            (new Date(Date.now())).toISOString(),
            "可用 User 為空，中斷更新。"
          );
        } else {
          console.error(
            "[noticeRefresh]",
            (new Date(Date.now())).toISOString(),
            "Taskpackage過濾失敗."
          );
        }
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask
        );
      }
    )
    .then(
      (resolveTask) => {
        console.log(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "Crawler 執行完畢."
        );
        return refreshDB(resolveTask);
      },
      (rejectTask) => {
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask
        )
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "Crawler 失敗."
        );
      }
    )
    .then(
      (resolveTask) => {
        console.log(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "資料庫更新完畢."
        )
        return Promise.resolve();
      },
      (rejectTask) => {
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          "資料庫更新 失敗."
        );
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask.err
        );
        console.error(
          "[noticeRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask.sql
        );
        return Promise.reject();
      }
    )
}

function filter(taskPackages) {

  var findMaxKey = (obj) => {
    var maxKey = false;
    for (key in obj) {
      if (!maxKey || obj[maxKey] < obj[key]) {
        maxKey = key
      }
    }
    return maxKey
  }

  return new Promise((resolve, reject) => {

    /**
     * 用 Vertex cover 演算法.....
     */

    /**
     * 產生 lesson set
     */
    var lessonSet = taskPackages.reduce(
      (previous, people, i, arr) => {
        people.lesson.forEach(
          (lesson, i, arr) => {
            if (!previous.hasOwnProperty(lesson.lesson_id)) {
              previous[lesson.lesson_id] = true;
            }
          }
        )
        return previous;
      }
    , {});

    /**
     * 依據 lessonList 從出現最多次的 People(user_uid) 開始挑
     */
    var minCoverSet = [];
    // Clone taskPackages
    var peopleSet = taskPackages
    while(Object.keys(lessonSet).length > 0) {
      /**
       * 計算每一個 user cover 的 lesson 數目
       */

      var userCoverSet = peopleSet.reduce(
        (previous, people, i, arr) => {
          previous[people.user_uid] = people.lesson.length;
          return previous;
        }
      , {});


      /**
       * 找 Cover 最多課的 user
       */
      var maxCover = findMaxKey(userCoverSet)
      var maxCoverUser = peopleSet.filter((v) => (v.user_uid == maxCover))[0];
      peopleSet = peopleSet.filter((v) => (v.user_uid != maxCover));

      minCoverSet.push(maxCoverUser);
      delete userCoverSet[maxCover];

      maxCoverUser.lesson.forEach(
        (coveredLesson, i, arr) => {
          /**
           * 從每一個 User 中移除已經被 Cover 的 lesson
           */
          peopleSet.forEach(
            (people, i, arr) => {
              people.lesson = people.lesson.filter((peopleLesson) => (peopleLesson.lesson_id != coveredLesson.lesson_id))
            }
          );

          /**
           * 從 lesson Set 移除已經被 cover 的 lesson
           */
          delete lessonSet[coveredLesson.lesson_id]
        }
      );

    }

    console.log(
      "[noticeRefresh]",
      (new Date(Date.now())).toISOString(),
      "本次取用set:"
    );

    minCoverSet.forEach((v) => {
      var lessonSet = v.lesson.reduce((pv, v) => {
        pv.push(v.lesson_id);
        return pv;
      }, [])
      console.log(
        "[noticeRefresh]",
        (new Date(Date.now())).toISOString(),
        v.portalUsername, lessonSet
      );
    });

    resolve(minCoverSet);
  });
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
            'notice',
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
                  notices: v.noticelist
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

function refreshDB(taskPackage) {
  return new Promise((resolve, reject) => {
    var queryStatement = "";
    var queryParams = [];
    taskPackage.forEach((people) => {
      people.forEach((lesson) => {
        queryStatement += "INSERT INTO lesson_info_refresh (lesson_id, messages_last_refresh_time) "
        + "VALUES "
        queryStatement += "(?, NOW()) ON DUPLICATE KEY "
        + "UPDATE messages_last_refresh_time = NOW() ;"
        queryParams.push(lesson.lesson_id)
      })
    })

    queryStatement += "CREATE TEMPORARY TABLE IF NOT EXISTS fetch_notice ( "
    + "  lesson_id int(10) unsigned,  "
    + "  portalId int(10) unsigned,  "
    + "  title varchar(200),  "
    + "  author varchar(200),  "
    + "  content text,  "
    + "  attach_id int(30) unsigned,  "
    + "  date datetime,  "
    + "  attachPortalId int(10) unsigned,  "
    + "  attachPortalType tinyint(2) unsigned, "
    + "  attachPortalFilename varchar(200) "
    + "); "

    taskPackage.forEach((people) => {
      people.forEach((lesson) => {
        lesson.notices.forEach((notice) => {
          queryStatement += "INSERT INTO fetch_notice SET ? ;"
          queryParams.push({
            lesson_id: lesson.lesson_id,
            portalId: notice.portalId,
            title: notice.title,
            author: notice.author,
            content: notice.content,
            date: notice.date,
            attachPortalId: notice.attach === null ? null : notice.attach.AttachmentID,
            attachPortalType: notice.attach === null ? null : notice.attach.CourseType,
            attachPortalFilename: notice.attach === null ? null : notice.attach.AttachmentFileName
          });
        })
      })
    })

    queryStatement += "INSERT INTO attachments (portalId, portalType, portalFilename) "
    + "SELECT attachPortalId AS portalId, "
    + "   attachPortalType AS portalType, "
    + "   attachPortalFilename AS portalFilename "
    + "FROM fetch_notice "
    + "WHERE attachPortalId IS NOT NULL "
    + "  AND attachPortalType IS NOT NULL "
    + "  AND attachPortalFilename IS NOT NULL "
    + "ON DUPLICATE KEY UPDATE attachments.portalId=attachments.portalId;"

    + "UPDATE attachments INNER JOIN fetch_notice ON "
    + "  attachPortalId = attachments.portalId "
    + "  AND attachPortalFilename = portalFilename "
    + "SET fetch_notice.attach_id = attachments.attach_id;"

    + "UPDATE notices INNER JOIN fetch_notice ON "
    + "  notices.lesson_id = fetch_notice.lesson_id "
    + "  AND notices.portalId = fetch_notice.portalId "
    + "SET notices.title = fetch_notice.title, "
    + "  notices.author = fetch_notice.author, "
    + "  notices.content = fetch_notice.content, "
    + "  notices.attach_id = fetch_notice.attach_id, "
    + "  notices.date = fetch_notice.date "
    + "; "

    + "DELETE FROM fetch_notice WHERE portalId IS NULL OR portalId IN (SELECT portalId FROM notices);"
    
    + "SELECT a.lesson_id,courseName,title,author,content FROM fetch_notice a LEFT JOIN lesson b ON a.lesson_id=b.lesson_id LEFT JOIN course c ON c.course_id=b.course_id;"

    + "INSERT INTO notices (lesson_id, portalId, title, author, content, attach_id, date) SELECT lesson_id, portalId, title, author, content, attach_id, date FROM fetch_notice fn "
    + "WHERE NOT EXISTS (SELECT 1 FROM notices WHERE fn.lesson_id = notices.lesson_id AND fn.portalId = notices.portalId); "

    + "DROP TABLE fetch_notice; "
    
    var query = dbHelper.query(queryStatement, queryParams,
      (err, result) => {
        if(err) {
          reject({err: err, sql: query.sql});
        } else {

           var sendList = {};
           var fetch_notice = result[result.length - 3];

           if(fetch_notice.length > 0)
           {
              fetch_notice.forEach((row)=>{
                var newData = {'courseName':row.courseName, 'tilte':row.title, 'author':row.author};
                if(row.lesson_id in sendList){
                    sendList[ row.lesson_id ].push(newData);
                }
                else{
                    sendList[ row.lesson_id ] = [newData];
                }
              });
              
              console.log(
                "[noticeRefresh]",
                (new Date(Date.now())).toISOString(),
                "Fetch "+Object.keys(sendList).length+" new notices."
              )

              var fcm = new FCM();
              for (var lesson_id in sendList){
                  var data = sendList[lesson_id];
                  if(data.length > 0)
                  {
                    var content = ""
                    data.map(x => content += ("[最新消息]"+x.tilte+".\n"));
                    fcm.setNotificationTitle(data[0].courseName);
                    fcm.setNotificationBody(content);
                    fcm.setTopic("lesson"+lesson_id);
                    fcm.PostFCM();
                  }

                  
              }
              
           }
           resolve();

        }
      }
    );
  });
}
