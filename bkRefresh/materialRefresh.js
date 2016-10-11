var dbHelper = require(__mobileAPIBase + 'module/dbHelper');
var helper = require(__mobileAPIBase + 'module/helper');
var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');
var refreshLead = require(__refreshBase + 'refreshLead');
var FCM = require(__mobileAPIBase + 'module/fcm');

module.exports = (next) => {
  console.log(
    "[materialRefresh]",
    (new Date(Date.now())).toISOString(),
    "執行教材資料庫更新"
  );

  var query = "" + "  SELECT user_uid, student_lesson.lesson_id, courseCode, lessonYear, lessonSemester, lessonClass " + "   FROM student_lesson LEFT JOIN lesson " + "      ON student_lesson.lesson_id = lesson.lesson_id " + "   WHERE lessonYear = ? AND lessonSemester = ?;";
  var params = [helper.getYearNow(), helper.getSemesterNow()];

  var task = new Promise((resolve, reject) => {
      console.log(
        "[materialRefresh]",
        (new Date(Date.now())).toISOString(),
        "取出課程清單"
      );
      var qs = dbHelper.query(query, params, (err, result, field) => {
        if (err) {
          console.error(
            "[materialRefresh]",
            (new Date(Date.now())).toISOString(),
            err
          );
          console.error(
            "[materialRefresh]",
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
          "[materialRefresh]",
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
        return materialRefresh(taskPackage)
      },
      (reject) => {
        console.log(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          "課程清單取出失敗"
        );
        return Promise.reject();
      }
    )
  return task;
}

function materialRefresh(taskPackages) {
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
          "[materialRefresh]",
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
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          "更新前置作業失敗."
        );
        console.error(
          "[materialRefresh]",
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
            "[materialRefresh]",
            (new Date(Date.now())).toISOString(),
            "可用 User 為空，中斷更新。"
          );
        } else {
          console.error(
            "[materialRefresh]",
            (new Date(Date.now())).toISOString(),
            "Taskpackage過濾失敗."
          );
        }
        console.error(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask
        );
      }
    )
    .then(
      (resolveTask) => {
        console.log(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          "Crawler 執行完畢."
        );
        return refreshDB(resolveTask);
      },
      (rejectTask) => {
        console.error(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask
        )
        console.error(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          "Crawler 失敗."
        );
      }
    )
    .then(
      (resolveTask) => {
        console.log(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          "資料庫更新完畢."
        )
        return Promise.resolve();
      },
      (rejectTask) => {
        console.error(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          "資料庫更新 失敗."
        );
        console.error(
          "[materialRefresh]",
          (new Date(Date.now())).toISOString(),
          rejectTask.err
        );
        console.error(
          "[materialRefresh]",
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
      "[materialRefresh]",
      (new Date(Date.now())).toISOString(),
      "本次取用set:"
    );

    minCoverSet.forEach((v) => {
      var lessonSet = v.lesson.reduce((pv, v) => {
        pv.push(v.lesson_id);
        return pv;
      }, [])
      console.log(
        "[materialRefresh]",
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
            'material',
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
                  materials: v.materials
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
        queryStatement += "INSERT INTO lesson_info_refresh (lesson_id, material_last_refresh_time) "
        + "VALUES "
        queryStatement += "(?, NOW()) ON DUPLICATE KEY "
        + "UPDATE material_last_refresh_time = NOW() ;"
        queryParams.push(lesson.lesson_id)
      })
    })

    queryStatement += "CREATE TEMPORARY TABLE IF NOT EXISTS fetch_material ( "
    + "  lesson_id int(10) unsigned,  "
    + "  schedule varchar(500) ,  "
    + "  outline varchar(500),  "
    + "  date datetime, "
    + "  attach_id int(30) unsigned,  "
    + "  link text,  "
    + "  video text,  "
    + "  attachPortalId int(10) unsigned,  "
    + "  attachPortalType tinyint(2) unsigned, "
    + "  attachPortalFilename varchar(200) "
    + "); "

    taskPackage.forEach((people) => {
      people.forEach((lesson) => {
        lesson.materials.forEach((material) => {
          queryStatement += "INSERT INTO fetch_material SET ? ;"
          queryParams.push({
            lesson_id: lesson.lesson_id,
            schedule: material.schedule,
            outline: material.outline,
            date: material.date,
            link: material.link,
            video: material.video,
            attachPortalId: material.lecture === null ? null : material.lecture.id,
            attachPortalType: material.lecture === null ? null : material.lecture.type,
            attachPortalFilename: material.lecture === null ? null : material.lecture.filename
          });
        })
      })
    })

    queryStatement += "DELETE FROM fetch_material "
    + "WHERE EXISTS "
    + "( "
    + "   SELECT 1 FROM ("
    + "     SELECT schedule, outline, date, link, video, portalId, portalType, portalFilename FROM "
    + "       materials LEFT JOIN "
    + "       attachments ON "
    + "         materials.attach_id = attachments.attach_id "
    + "   ) AS db"
    + "   WHERE md5(CONCAT(IFNULL(db.schedule, ''), IFNULL(db.outline, ''), "
    + "               IFNULL(db.date, ''), IFNULL(db.link, ''), IFNULL(db.video, ''), "
    + "               IFNULL(db.portalId, ''), IFNULL(db.portalType, ''), "
    + "               IFNULL(db.portalFilename, '')))"
    + "         = md5(CONCAT(IFNULL(fetch_material.schedule, ''), "
    + "                     IFNULL(fetch_material.outline, ''), "
    + "                     IFNULL(fetch_material.date, ''), "
    + "                     IFNULL(fetch_material.link, ''), "
    + "                     IFNULL(fetch_material.video, ''), "
    + "                     IFNULL(fetch_material.attachPortalId, ''), "
    + "                     IFNULL(fetch_material.attachPortalType, ''), "
    + "                     IFNULL(fetch_material.attachPortalFilename, '')))"
    + ");"

    + "INSERT INTO attachments (portalId, portalType, portalFilename) "
    + "SELECT attachPortalId AS portalId, "
    + "   attachPortalType AS portalType, "
    + "   attachPortalFilename AS portalFilename "
    + "FROM fetch_material "
    + "WHERE attachPortalId IS NOT NULL "
    + "  AND attachPortalType IS NOT NULL "
    + "  AND attachPortalFilename IS NOT NULL "
    + "ON DUPLICATE KEY UPDATE attachments.portalId=attachments.portalId"
    + "; "

    + "UPDATE attachments INNER JOIN fetch_material ON "
    + "  attachPortalId = attachments.portalId "
    + "  AND attachPortalFilename = portalFilename "
    + "SET fetch_material.attach_id = attachments.attach_id;"

    + "SELECT * FROM fetch_material WHERE attach_id NOT IN (SELECT attach_id FROM materials) ;"

    + "INSERT INTO materials (lesson_id, schedule, outline, date, link, video, attach_id) SELECT lesson_id, schedule, outline, date, link, video, attach_id FROM fetch_material; "

    //+ "DROP TABLE fetch_material; "

    var query = dbHelper.query(queryStatement, queryParams,
      (err, result) => {
        if(err) {
          reject({err: err, sql: query.sql});
        } else {

           var sendList = {};
           var fetch_material = result[25];

           if(fetch_material.length > 0)
           {
              fetch_material.forEach((row)=>{
                var newData = {'outline':row.outline, 'schedule':row.schedule};
                if(row.lesson_id in sendList){
                    sendList[ row.lesson_id ].push(newData);
                }
                else{
                    sendList[ row.lesson_id ] = [newData];
                }

              });

              var fcm = new FCM();
              for (var lesson_id in sendList){
                  var msg = JSON.stringify(sendList[lesson_id]);
                  fcm.setData(msg);
                  fcm.setNotification(lesson_id, "new");
                  fcm.sendTopic("lesson"+lesson_id);
              }
              
           }
           resolve();

        }
      }
    );
  });
}
