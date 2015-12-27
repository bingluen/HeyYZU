var PyScript = require(__MobileAppBase + 'modules/runPython');
var Logging = require(__SystemBase + 'modules/logging')('mobileAPI');
var Database = require(__MobileAppBase + 'modules/database');
var RSA = require(__MobileAppBase + 'modules/rsa');
var Token = require(__MobileAppBase + 'modules/token');
var Course = require(__MobileAppBase + 'modules/course')
var Notice = require(__MobileAppBase + 'modules/news');
var privateRSA = RSA('private');
var publicRSA = RSA();
var ursa = require('ursa');
var moment = require('moment');

module.exports.login = function(req, res, next) {
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
        Logging.writeMessage('[Response][DatabaseError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' } [' + err + ']','access')
        res.status(500).json({
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
        res.status(500).json(resM);
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
          Logging.writeMessage('[Response][DatabaseError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' } [' + err + ']','access')
          res.status(500).json({
            state: 'InternalError',
            messages: 'Internal error',
            statusCode: 1004
          })
          return;
        } else {
          userData.id = row.insertId;
          Course.getCourseHistory({
            portalUsername: userData.portalUsername,
            portalPassword: userData.portalPassword,
            id: row.insertId
          }, function(r) {
            if(r)
            {
              createToken()
            }
            else
            {
              res.status(500).json({
                state: 'InternalError',
                messages: 'Internal error',
                statusCode: 1004
              })
            }
          })

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
      res.status(500).json(resM);
      Logging.writeMessage('[Response][loginFail]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
    }
  }

  //紀錄Log
  Logging.writeMessage('[Request]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }' ,'access')

  //檢驗資料欄位，messages不存在，直接退回
  if(!req.body.messages) {
    Logging.writeMessage('[Response][ParamsError]['+ req.ip +']path:user/login. DetailIp{ '+ req.ips + ' }','access')
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
      stateCode: 1004,
      status: 'ParamInvalid',
      message: 'Param Invalid'
    })
    return;
  }

  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/profile) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1005,
        status: 'TokeInvalid',
        message: 'TokenInvalid'
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
    res.status(500).json({
      stateCode: 1004,
      status: 'ParamInvalid',
      message: 'Param Invalid'
    })
    return;
  }

  // verifyToken
  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/courses) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1005,
        status: 'TokeInvalid',
        message: 'TokenInvalid'
      })
    } else {
      getCourses(userData);
    }
  })

  var getCourses = function(userData) {
    Course.getCurrentCourse({id: userData.id}, function(r) {
      res.status(200).json(r)
    })
  }

}

module.exports.homework = function(req, res, next) {
  if(!req.body.token) {
    Logging.writeMessage('response to (mobileApp/user/homework) ' + req.ips ,'access')
    res.status(500).json({
      stateCode: 1004,
      status: 'ParamInvalid',
      message: 'Param Invalid'
    })
    return;
  }

  // verifyToken
  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/homework) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1005,
        status: 'TokeInvalid',
        message: 'TokenInvalid'
      })
    } else {
      getHomework(userData);
    }
  })

  // get homework
  var getHomework = function(userData) {
    Course.getHomework({id: userData.id, portalUsername: userData.portalUsername, portalPassword: privateRSA.decrypt(userData.portalPassword, 'base64', 'utf8')}, processingHomework)
  }

  var processingHomework = function(hw)
  {
    hw = hw.filter(cv => (cv.uploadFile == null && (moment(cv.deadline) - moment() >= 0)) )

    hw = hw.map(function(cv) {
      cv.deadline = moment(cv.deadline).add({hours:23, minutes:59, seconds:59}).format("YYYY-MM-DD HH:mm:ss")
      return cv;
    })


    res.status(200).json(hw);
  }
}

module.exports.notice = function(req, res, next) {
  var ud = {}
  if(!req.body.token) {
    Logging.writeMessage('response to (mobileApp/user/homework) ' + req.ips ,'access')
    res.status(500).json({
      stateCode: 1004,
      status: 'InternalError',
      message: 'Internal Error'
    })
    return;
  }

  // verifyToken
  Token.verifyToken(req.body.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/notice) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1005,
        status: 'TokeInvalid',
        message: 'Toke Invalid'
      })
    } else {
      checkNoticeUpdateTime(userData);
    }
  })


  //check notice update time
  var checkNoticeUpdateTime = function(userData) {
    ud = {id: userData.id, portalUsername: userData.portalUsername, portalPassword: privateRSA.decrypt(userData.portalPassword, 'base64', 'utf8')};
    //refresh notice update time Table
    Notice.renewNoticeList(function(err, result) {
      if(!err) {
        if(result.affectedRows > 0) {
          Notice.catch(ud, function() {
            Notice.getNews(ud, response);
          })
        } else {
          Notice.getUpdateTime(ud, policy);
        }
      } else {
        Logging.writeMessage('response to (mobileApp/user/notice) ' + req.ips ,'access')
        res.status(500).json({
          stateCode: 1004,
          status: 'InternalError',
          message: 'Internal Error'
        })
      }
    });

  }

  var policy = function(err, result) {
    if(err) {
      Logging.writeMessage('response to (mobileApp/user/notice) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1004,
        status: 'InternalError',
        message: 'Internal Error'
      })
    } else {
      result = result.filter(cv => moment() - moment(cv.update_time) > 15 * 60 * 1000)
      if (result.length > 0) {
        Notice.catch(ud, function() {
          Notice.getNews(ud, response);
        })
      } else {
        Notice.getNews(ud, response)
      }
    }
  }

  var response = function(err, result) {
    if(err) {
      Logging.writeMessage('response to (mobileApp/user/notice) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1004,
        status: 'InternalError',
        message: 'Internal Error'
      })
    } else {
      res.status(200).json({
        stateCode: 200,
        state: 'get notice Success',
        messages: 'get notice Success',
        data: result.map(function(cv) {
          cv.date = moment(cv.date).format("YYYY-MM-DD")
          return cv;
        })
      })
    }
  }
}

module.exports.attach = function(req ,res, next) {
  if(!req.params.token) {
    Logging.writeMessage('response to (mobileApp/user/getAttach) ' + req.ips ,'access')
    res.status(500).json({
      stateCode: 1004,
      status: 'InternalError',
      message: 'Internal Error'
    })
    return;
  }

  // verifyToken
  Token.verifyToken(req.params.token, function(isValid, userData) {
    if(!isValid) {
      Logging.writeMessage('response to (mobileApp/user/getAttach) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1005,
        status: 'TokeInvalid',
        message: 'Toke Invalid'
      })
    } else {
      catchAttach(userData);
    }
  })

  var catchAttach = function(userData) {
    ud = {id: userData.id, portalUsername: userData.portalUsername, portalPassword: privateRSA.decrypt(userData.portalPassword, 'base64', 'utf8')};

    if ((req.params.type == 'notice' || req.params.type == 'homework') && (parseInt(req.params.attachID) && req.params.attachName)) {
      if(req.params.type == 'notice') {
        PyScript({
          args: ['getAttach', ud.portalUsername, ud.portalPassword, parseInt(req.params.attachID), req.params.attachName],
          scriptFile: 'news.py'
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
            var buffer = new Buffer(r.result, 'base64')
            res.writeHead(200, {
              'Content-Type': req.params.attachName.match(/\.(.*)$/)[1],
              'Content-Length': buffer.length
            });
            res.end(buffer);
          }
        })
      } else {
        PyScript({
          args: ['getAttach', ud.portalUsername, ud.portalPassword, parseInt(req.params.attachID), req.params.attachName],
          scriptFile: 'homework.py'
        }, function(r) {
          if(r)
          {
            var buffer = new Buffer(r.result, 'base64')
            res.writeHead(200, {
              'Content-Type': req.params.attachName.match(/\.(.*)$/)[1],
              'Content-Length': buffer.length
            });
            res.end(buffer);
          }
        })
      }
    } else {
      Logging.writeMessage('response to (mobileApp/user/getAttach) ' + req.ips ,'access')
      res.status(500).json({
        stateCode: 1006,
        status: 'ParamsInvalid',
        message: 'Params Invalid'
      })
    }
  }
}
