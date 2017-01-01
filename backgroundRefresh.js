var path = require('path');
global.__mobileAPIBase = path.join(__dirname, '/mobileAPI/');
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__refreshBase = path.join(__dirname, '/bkRefresh/');
global.__SystemBase = __dirname + '/'

var dbHelper = require(__mobileAPIBase + 'module/dbHelper');
var helper = require(__mobileAPIBase + 'module/helper');
var rsa = require(__mobileAPIBase + 'module/rsa');
var PythonShell = require('python-shell');
var fs = require('fs-extra');
var crypto = require('crypto');
timeInterval = 15 * 60 * 1000;

function task() {
  let lookupUser = new Promise((resolve, reject) => {
    let qs = "SELECT student.`user_uid` as `user_uid`, `portalUsername`, `portalPassword`, lesson.`lesson_id`, `courseCode`, `lessonYear`, `lessonSemester`, `lessonClass` "
    + " FROM student RIGHT JOIN ( "
    + " SELECT `user_uid`, student_lesson.`lesson_id`, `courseCode`, `lessonYear`, `lessonSemester`, `lessonClass` "
    + " FROM `student_lesson` "
    + " LEFT JOIN lesson ON student_lesson.`lesson_id` = lesson.`lesson_id` "
    + " WHERE `lessonYear` = ? AND `lessonSemester` = ?) as lesson "
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
    let current_date = (new Date()).valueOf().toString();
    let random = Math.random().toString();
    let swap = crypto.createHash('sha1').update(current_date + random).digest('hex');

    return new Promise((resolve, reject) => {
      let PyOptions = {
        mode: 'json',
        scriptPath: __refreshBase,
        args: [swap]
      }
      fs.writeJSONSync(__refreshBase + swap, packet);
      PythonShell.run('main.py', PyOptions, function (err, results) {
        if(!err)
          resolve();
        else
        {
          reject({err: "Can't run python script : " + PyOptions.scriptPath + 'main.py' + ' and error message: ' + err});
        }
      });
    }).then(() => {
      return fs.readJSONSync(swap);
    })
    ;
  }

  let write = (packet) => {
    console.log(packet);
    return Promise.resolve('db write done');
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
    .then((result) => {
      console.log(result);
    }, (err) => {
      console.error(err);
    })

}

setInterval(task, timeInterval);
