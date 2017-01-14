var path = require('path');
global.__mobileAPIBase = path.join(__dirname, '/mobileAPI/');
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__refreshBase = path.join(__dirname, '/bkRefresh/');
global.__SystemBase = __dirname + '/'

var dbHelper = require(__mobileAPIBase + 'module/dbHelper');
var helper = require(__mobileAPIBase + 'module/helper');
var rsa = require(__mobileAPIBase + 'module/rsa');
var fs = require('fs-extra');
var crypto = require('crypto');
var spawn = require('child_process').spawn,


timeInterval = 15 * 60 * 1000;

function task() {
  let current_date = (new Date()).valueOf().toString();
  let random = Math.random().toString();
  let swap = crypto.createHash('sha1').update(current_date + random).digest('hex');

  let lookupUser = new Promise((resolve, reject) => {

    console.log('[' + (new Date()).toString() + ']Look up user')

    let qs = "SELECT student.`user_uid` as `user_uid`, `portalUsername`, `portalPassword`, lesson.`lesson_id`, `courseCode`, `lessonYear`, `lessonSemester`, `lessonClass` "
    + " FROM student RIGHT JOIN ( "
    + " SELECT `user_uid`, student_lesson.`lesson_id`, `courseCode`, `lessonYear`, `lessonSemester`, `lessonClass` "
    + " FROM `student_lesson` "
    + " LEFT JOIN lesson ON student_lesson.`lesson_id` = lesson.`lesson_id` "
    + " WHERE `lessonYear` = ? AND `lessonSemester` = ? "
    + " AND EXISTS (SELECT distinct owner_user FROM device) "
    + ") as lesson "
    + " ON lesson.`user_uid` = student.`user_uid`;";
    let params = [helper.getYearNow(), helper.getSemesterNow()];
    dbHelper.query(qs, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  })

  let decrypt = (userPacks) => {
    return userPacks.map((el) => ({
      user_uid: el.user_uid,
      username: el.portalUsername,
      password: el.portalPassword,
      lesson_id: el.lesson_id,
      courseCode: el.courseCode,
      lessonYear: el.lessonYear,
      lessonSemester: el.lessonSemester,
      lessonClass: el.lessonClass
    })).reduce((p, el, index, array) => {
      let user = p.find((els) => els.user_uid === el.user_uid)
      if(user === undefined) {
        p.push({
          user_uid: el.user_uid,
          username: el.username,
          password: el.password,
          lessons: [{
            lesson_id: el.lesson_id,
            courseCode: el.courseCode,
            lessonYear: el.lessonYear,
            lessonSemester: el.lessonSemester,
            lessonClass: el.lessonClass
          }]
        })
      } else {
        user.lessons.push({
          lesson_id: el.lesson_id,
          courseCode: el.courseCode,
          lessonYear: el.lessonYear,
          lessonSemester: el.lessonSemester,
          lessonClass: el.lessonClass
        })
      }
      return p;
    }, []).map((el) => {
      el.password = rsa.priDecrypt(el.password);
      return el;
    })
  }

  let runPy = (packet) => {

    console.log('[' + (new Date()).toString() + ']Running python')


    fs.writeJSONSync(__refreshBase + swap, packet);

    return new Promise((resolve, reject) => {
      ps = spawn('python', [ __refreshBase + 'main.py', __refreshBase + swap]);

      let isErr = false;

      ps.stdout.on('data', function(msg) {
        console.log('[' + (new Date()).toString() + ']' + msg);
      });

      ps.stderr.on('data', function(err) {
        isErr = true
        console.error('[' + (new Date()).toString() + ']' + err);
      });

      ps.on('close', function(code) {
        if (!isErr) {
          resolve()
        } else {
          reject("something wrong white runing python script.")
        }
      });

    }).then(() => {
      let result = fs.readJSONSync(__refreshBase + swap);
      fs.removeSync(__refreshBase + swap)
      return result;
    })
    ;
  }

  let write = (packet) => {
    let qs = "";
    let params = [];

    // create temporary table
    qs += "CREATE TEMPORARY TABLE IF NOT EXISTS temp_notice ( "
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

    qs += "CREATE TEMPORARY TABLE IF NOT EXISTS temp_material ( "
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

    qs += "CREATE TEMPORARY TABLE IF NOT EXISTS temp_homework ( "
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
      + "  attachPortalFilename varchar(200) "
      + "); "

    qs += "CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_hw ("
      + "  lesson_id int(10) unsigned,  "
      + "  wkId int(3) unsigned,  "
      + "  grade int(4), "
      + "  comment text, "
      + "  user_uid int(30) unsigned, "
      + "  homework_id int(30) unsigned "
      + "); "

    // insert result into temporary table

    qs += "INSERT INTO temp_notice (lesson_id, portalId, title, author, content, date, attachPortalId, attachPortalType, attachPortalFilename) VALUES "
    packet.news.forEach((el, i, arr) => {
      qs += "(?, ?, ?, ?, ?, ?, ?, ?, ?) "
      if (i < arr.length - 1) {
        qs += ", "
      }
      params.push(el.lesson_id, el.portalId,
        el.subject, el.author, el.content,
        el.date, el.attach ? el.attach.AttachmentID : null,
        el.attach ? el.attach.CourseType : null,
        el.attach ? el.attach.AttachmentFileName : null
      )
    })
    qs += ";"

    qs += "INSERT INTO temp_material (lesson_id, schedule, outline, date, link, video, attachPortalId, attachPortalType, attachPortalFilename) VALUES "
    packet.material.forEach((el, i, arr) => {
      qs += "(?, ?, ?, ?, ?, ?, ?, ?, ?) "
      if (i < arr.length - 1) {
        qs += ", "
      }
      params.push(el.lesson_id, el.schedule,
        el.outline, el.date, el.link,
        el.video, el.lecture ? el.lecture.id : null,
        el.lecture ? el.lecture.type : null,
        el.lecture ? el.lecture.filename : null
      )
    })
    qs += ";"


    qs += "INSERT INTO temp_homework (lesson_id, wkId, title, schedule, description, isGroup, freeSubmit, deadline, attachPortalId, attachPortalType, attachPortalFilename) VALUES "
    packet.homework.forEach((el, i, arr) => {
      qs += "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
      if (i < arr.length - 1) {
        qs += ", "
      }
      params.push(el.lesson_id, el.wk_id,
        el.subject, el.schedule, el.description,
        el.isGroup, el.freeSubmit, el.deadline,
        el.attach ? el.attach.id : null,
        el.attach ? el.attach.type : null,
        el.attach ? el.attach.filename : null
      )
    })
    qs += ";"

    qs += "INSERT INTO temp_user_hw (lesson_id, wkId, user_uid, grade, comment) VALUES "
    packet.userHW.forEach((el, i, arr) => {
      qs += "(?, ?, ?, ?, ?) "
      if (i < arr.length - 1) {
        qs += ", "
      }
      params.push(el.lesson_id, el.wk_id, el.user_uid, el.grade, el.comment)
    })
    qs += ";"

    // insert attachment

    qs += "INSERT INTO attachments (portalId, portalType, portalFilename) "
      + "SELECT attachPortalId AS portalId, "
      + "   attachPortalType AS portalType, "
      + "   attachPortalFilename AS portalFilename "
      + "FROM temp_notice "
      + "WHERE attachPortalId IS NOT NULL "
      + "  AND attachPortalType IS NOT NULL "
      + "  AND attachPortalFilename IS NOT NULL "
      + "GROUP BY portalId "
      + "ON DUPLICATE KEY UPDATE portalId=portalId;"

    qs += "INSERT INTO attachments (portalId, portalType, portalFilename) "
      + "SELECT attachPortalId AS portalId, "
      + "   attachPortalType AS portalType, "
      + "   attachPortalFilename AS portalFilename "
      + "FROM temp_material "
      + "WHERE attachPortalId IS NOT NULL "
      + "  AND attachPortalType IS NOT NULL "
      + "  AND attachPortalFilename IS NOT NULL "
      + "GROUP BY portalId "
      + "ON DUPLICATE KEY UPDATE portalId=portalId;"


    qs += "INSERT INTO attachments (portalId, portalType, portalFilename) "
      + "SELECT attachPortalId AS portalId, "
      + "   attachPortalType AS portalType, "
      + "   attachPortalFilename AS portalFilename "
      + "FROM temp_homework "
      + "WHERE attachPortalId IS NOT NULL "
      + "  AND attachPortalType IS NOT NULL "
      + "  AND attachPortalFilename IS NOT NULL "
      + "GROUP BY portalId "
      + "ON DUPLICATE KEY UPDATE portalId=portalId;"

    // update attach_id for temporary table
    qs += "UPDATE attachments INNER JOIN temp_homework ON "
      + "  temp_homework.attachPortalId = attachments.portalId "
      + "  AND attachPortalFilename = portalFilename "
      + "SET temp_homework.attach_id = attachments.attach_id;"

    qs += "UPDATE attachments INNER JOIN temp_material ON "
      + "  temp_material.attachPortalId = attachments.portalId "
      + "  AND attachPortalFilename = portalFilename "
      + "SET temp_material.attach_id = attachments.attach_id;"

    qs += "UPDATE attachments INNER JOIN temp_notice ON "
      + "  temp_notice.attachPortalId = attachments.portalId "
      + "  AND attachPortalFilename = portalFilename "
      + "SET temp_notice.attach_id = attachments.attach_id;"

    // update news
    qs += "INSERT INTO notices (lesson_id, portalId, title, author, content, attach_id, date) "
      + "SELECT lesson_id, portalId, title, author, content, attach_id, date FROM temp_notice as n "
      + "ON DUPLICATE KEY UPDATE lesson_id = n.lesson_id, title = n.title, author = n.author, content = n.content, attach_id = n.attach_id, date = n.date;"

    // update material
    qs += "TRUNCATE TABLE materials;"
    qs += "INSERT INTO materials (lesson_id, schedule, outline, date, attach_id, link, video) "
      + "SELECT lesson_id, schedule, outline, date, attach_id, link, video FROM temp_material as m;"

    // update homeworks

    qs += "INSERT INTO homeworks (lesson_id, wkId, title, schedule, description, attach_id, isGroup, freeSubmit, deadline) "
      + "SELECT lesson_id, wkId, title, schedule, description, attach_id, isGroup, freeSubmit, deadline FROM temp_homework as h "
      + "ON DUPLICATE KEY UPDATE title = h.title, schedule = h.schedule, description = h.description, attach_id = h.attach_id, isGroup = h.isGroup, freeSubmit = h.freeSubmit, deadline = h.deadline;"

    // update student's homework
    qs += "UPDATE homeworks as h INNER JOIN temp_user_hw as uh ON "
      + "  h.lesson_id = uh.lesson_id "
      + "  AND h.wkId = uh.wkId "
      + "SET uh.homework_id = h.homework_id;"

    qs += "INSERT INTO student_homeworks (user_uid, homework_id, grade, comment) "
      + "SELECT user_uid, homework_id, grade, comment FROM temp_user_hw as uh "
      + "ON DUPLICATE KEY UPDATE grade = uh.grade, comment = uh.comment;"

    // remove invalid user_uid device

    qs += "DELETE FROM device WHERE owner_user IN ("
    packet.invalid.forEach((el, i, arr) => {
      qs += "?"
      if (i < arr.length - 1) {
        qs += ", "
      } else {
        qs += ");"
      }
      params.push(el)
    });

    return new Promise((resolve, reject) => {
      dbHelper.query(qs, params, (err, result) => {
        if (err) {
          reject(err)
        } else {
          fs.writeJSONSync(__refreshBase + 'sql_exec_result.json', result);
          resolve(result);
        }
      });
    })

  }

  let pushNotification = (packet) => {
    console.log('to push notfication to user');
    console.log(packet);
  }

  lookupUser
    .then((packet) => {
      return decrypt(packet);
    })
    .then((packet) => {
      return runPy(packet);
    })
    .then((packet) => {
      return write(packet);
    })
    .then((packet) => {
      return pushNotification(packet)
    })
    .then((result) => {
      console.log(result);
      setTimeout(task, timeInterval);
    }, (err) => {
      console.error(err);
      setTimeout(task, timeInterval);;
    })

}

task();
