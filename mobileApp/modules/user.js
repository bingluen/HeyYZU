var PyScript = require(__MobileAppBase + 'modules/runPython');
var Logging = require(__SystemBase + 'modules/logging')('mobileAPI');
var Database = require(__MobileAppBase + 'modules/database');
var RSA = require(__MobileAppBase + 'modules/rsa');
var Token = require(__MobileAppBase + 'modules/token');
var privateRSA = RSA('private');
var publicRSA = RSA();
var ursa = require('ursa');

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

module.exports.login = function(req, res, next) {
  /* ==== 測試用 ====
  var publicRSA = RSA();

  var testdata = {
    username: '',
    password: ''
  }


  var encryptPublic = publicRSA.encrypt(JSON.stringify(testdata),'utf8', 'base64', ursa.RSA_PKCS1_PADDING);

  console.log('========密文是=========')
  console.log(encryptPublic);
  console.log('========解密後=========')
  console.log(privateRSA.decrypt(encryptPublic, 'base64', 'utf8', ursa.RSA_PKCS1_PADDING))
  /* ===== 測試用END ==== */

  var userData = {}

  //portal帳號密碼檢驗器
  var loginPortal = function(next) {
    PyScript({
      args: ['login', userData.username, userData.password],
      scriptFile: 'user.py'
    }, next)
  }

  //從portal 爬user profile
  var getProfile = function(next) {
    PyScript({
      args: ['getProfile', userData.username, userData.password],
      scriptFile: 'user.py'
    }, next)
  }

  //Token 產生 function
  var createToken = function() {
    var token = Token.createToken(userData)
    res.status(200).json({
      state: 'LoginSuccess',
      messages: 'Login success',
      statusCode: 200,
      data: {
        token: token
      }
    })
  }

  //註冊確認
  var isRegister = function() {
    var queryStatment = 'SELECT id, portalUsername, lastVerifyTime, birth From user Where portalUsername = ?';
    var params = [];
    params.push(userData.username);
    Database.query(queryStatment, params, function(err, row, field) {
      if (err) {
        Logging.writeMessage('[Response][DatabaseError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
        res.status(1004).json({
          state: 'InternalError',
          messages: 'Internal error',
          statusCode: 1004
        })
        return;
      }
      if (row.length != 1) {
        doRegister()
      } else {
        userData = row[0]
        createToken()
      }
    });
  }

  //進行註冊
  var doRegister = function() {
    var queryStatment = 'INSERT INTO user (chiName, engName, portalUsername, portalPassword, cellphone, email, gender, birth) Value (?, ?, ?, ?, ?, ?, ?, ?)';

    getProfile(function(r) {
      if (r.status.statusCode == 1002) {
        resM = {}
        resM.state = r.status.state;
        resM.messages = r.status.messages;
        resM.statusCode = r.status.statusCode;
        res.status(resM.statusCode).json(resM);
        Logging.writeMessage('[Response][loginFail]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
        return;
      }
      var params = [];
      userData = r.profile;
      params.push(userData.chiName);
      params.push(userData.engName);
      params.push(userData.portalUsername);
      params.push(publicRSA.encrypt(userData.portalPassword, 'utf8' , 'base64'));
      params.push(userData.cellphone);
      params.push(userData.email);
      params.push((userData.gender == '\u7537' ? 1 : 0));
      params.push(userData.birth);
      Database.query(queryStatment, params, function(err, row, field) {
        if(err) {
          Logging.writeMessage('[Response][DatabaseError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
          res.status(1004).json({
            state: 'InternalError',
            messages: 'Internal error',
            statusCode: 1004
          })
          return;
        } else {
          userData.id = row.insertId;
          createToken()
        }
      })
    })
  }

  //login callback
  var loginCallback = function(r) {

    if(r.status.statusCode === 1001) {
      //登入成功
      isRegister();
    } else if(r.status.statusCode === 1002) {
      //登入失敗
      resM = {}
      resM.state = r.status.state;
      resM.messages = r.status.messages;
      resM.statusCode = r.status.statusCode;
      res.status(resM.statusCode).json(resM);
      Logging.writeMessage('[Response][loginFail]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
    }
  }

  //紀錄Log
  Logging.writeMessage('[Request]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }' ,'access')

  //檢驗資料欄位，messages不存在，直接退回
  if(!req.body.messages) {
    Logging.writeMessage('[Response][ParamsError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
    res.status(1003).json({
      state: 'ParamsError',
      messages: 'Params can not be read',
      statusCode: 1003
    })
    return;
  }

  //解碼後解析為JSON
  var params = JSON.parse(privateRSA.decrypt(req.body.messages, 'base64', 'utf8', ursa.RSA_PKCS1_PADDING));

  //檢查帳號密碼是否存在
  if(!params.username || !params.username.match(/^s(9[0-9]|1[0-9]{2})[0-9]{4}$/g) || !params.password) {
    Logging.writeMessage('[Response][ParamsError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
    res.status(1003).json({
      state: 'ParamsError',
      messages: 'Params can not be read',
      statusCode: 1003
    })
    return;
  } else {
    userData.username = params.username;
    userData.password = params.password;
    loginPortal(loginCallback)
  }
}

module.exports.profile = function(req, res, next) {
  Logging.writeMessage('Access mobileApp/user/profile from ' + req.ips ,'access')

  if(!req.body.token) {
    Logging.writeMessage('response to (mobileApp/user/profile) ' + req.ips ,'access')
    res.status(1004).json({
      stateCode: 1004,
      status: 'ParamInvalid',
      message: 'Param Invalid',
    })
    return;
  }

  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/profile) ' + req.ips ,'access')
      res.status(1004).json({
        stateCode: 1004,
        status: 'TokeInvalid',
        message: 'TokenInvalid',
      })
    } else {
      res.status(200).json({
        stateCode: 200,
        status: 'Success',
        message: 'get profile successful',
        data: {
          chiName: userData.chiName,
          engName: userData.engName,
          portalUsername: userData.portalUsername
        }
      })
      Logging.writeMessage('response to (mobileApp/user/profile) ' + req.ips ,'access')
    }
  })
}

module.exports.courses = function(req, res , next) {
  if(!req.body.token) {
    Logging.writeMessage('response to (mobileApp/user/courses) ' + req.ips ,'access')
    res.status(1004).json({
      stateCode: 1004,
      status: 'ParamInvalid',
      message: 'Param Invalid',
    })
    return;
  }

  // verifyToken
  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/courses) ' + req.ips ,'access')
      res.status(1004).json({
        stateCode: 1004,
        status: 'TokeInvalid',
        message: 'TokenInvalid',
      })
    } else {
      getCourses(userData);
    }
  })

  // get courses
  var getCourses = function(userData) {
    PyScript({
      args: ['getCourse', userData.portalUsername, privateRSA.decrypt(userData.portalPassword, 'base64', 'utf8')],
      scriptFile: 'user.py'
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
    +  "primary key(temp_id)"
    + ");";
    // Insert user data
    for(i = 0; i < courses.length; i++)
      queryStatment += "INSERT INTO userCourseTemp SET ?;"

    queryStatment += "INSERT INTO userCourse (user_id, course_unique_id) "

    //Inner Join to get course_id
    queryStatment += "Select " + Database.escape(userData.id) + " as user_id, rtc.unique_id as course_unique_id from "
    queryStatment += "(SELECT courses.course_id, userCourseTemp.semester, userCourseTemp.class, userCourseTemp.year FROM (userCourseTemp INNER JOIN courses ON userCourseTemp.code = courses.code)) as uc "
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

    queryStatment += "SELECT relation_teacher_course.unique_id, courses.cname, relation_teacher_course.classroom FROM "
    queryStatment += "courses INNER JOIN relation_teacher_course ON courses.course_id = relation_teacher_course.course_id "
    queryStatment += "Where (relation_teacher_course.unique_id in (SELECT course_unique_id FROM userCourse Where user_id = "+ userData.id +") and relation_teacher_course.year = "+ Database.escape(getYearNow()) +" and relation_teacher_course.semester = "+ Database.escape(getSemesterNow()) +");"

    query = Database.query(queryStatment, courses, function(err, result, field) {
      if(!err) {
        var resData = [];

        for(i = 0; i < result[result.length - 1].length; i++)
        {

          try {
            classroom = JSON.parse(result[result.length - 1][i].classroom.replace(/\'/g, "\""))

            for(j in classroom)
            {
              var row = {
                classid: result[result.length - 1][i].unique_id,
                name: result[result.length - 1][i].cname,
                start_time: lessonToTime(j),
                end_time: (lessonToTime(j)+1),
                location: classroom[j]
              }
              resData.push(row)
            }
          } catch (err) {
          }
        }

        res.status(200).json(resData);

      } else {
        console.log(err);
      }
    })
    /* debug
    console.log(query.sql);
    /* debug */
  }
}

module.exports.homework = function(req, res, next) {
  if(!req.body.token) {
    Logging.writeMessage('response to (mobileApp/user/homework) ' + req.ips ,'access')
    res.status(1004).json({
      stateCode: 1004,
      status: 'ParamInvalid',
      message: 'Param Invalid',
    })
    return;
  }

  // verifyToken
  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/homework) ' + req.ips ,'access')
      res.status(1004).json({
        stateCode: 1004,
        status: 'TokeInvalid',
        message: 'TokenInvalid',
      })
    } else {
      getHomework(userData);
    }
  })

  // get homework
  var getHomework = function(userData) {
    PyScript({
      args: ['doing', userData.portalUsername, privateRSA.decrypt(userData.portalPassword, 'base64', 'utf8'), getYearNow(), getSemesterNow()],
      scriptFile: 'homework.py'
    }, function(r) {
      processingHomework(r, userData);
    })
  }

  var processingHomework = function(hw, user)
  {
    console.log(hw)
    res.status(200).json(hw);
  }
}
