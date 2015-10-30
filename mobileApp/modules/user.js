var PyScript = require(__MobileAppBase + 'modules/runPython');
var Logging = require(__SystemBase + 'modules/logging')('mobileAPI');
var Database = require(__MobileAppBase + 'modules/database');
var RSA = require(__MobileAppBase + 'modules/rsa');
var Token = require(__MobileAppBase + 'modules/token');

module.exports.login = function(req, res, next) {
  var privateRSA = RSA('private')
  /* ==== 測試用 ====
  var publicRSA = RSA();

  var testdata = {
    username: '',
    password: ''
  }

  var encryptPrivate = privateRSA.encryptPrivate(JSON.stringify(testdata), 'base64', 'utf-8');
  var encryptPublic = publicRSA.encrypt(JSON.stringify(testdata),'base64', 'utf-8');

  console.log('========密文是=========')
  console.log(encryptPublic);
  console.log('========解密後=========')
  console.log(privateRSA.decrypt(encryptPublic, 'utf-8'))
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
    var publicRSA = RSA()
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
      params.push(publicRSA.encrypt(userData.portalPassword, 'base64', 'utf-8'));
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
  var params = JSON.parse(privateRSA.decrypt(req.body.messages));

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
