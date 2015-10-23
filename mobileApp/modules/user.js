var PyScript = require(__MobileAppBase + 'mobileApp/modules/runPython');
var Logging = require(__MobileAppBase + 'modules/logging')('mobileAPI');
var Database = require(__MobileAppBase + 'modules/database');

module.exports.login = function(req, res, next) {

  Logging.writeMessage('Access mobileApp/user/login from ' + req.ip ,'access')
  loginPortal(req.body.username, req.body.password, function(r) {
    console.log(r)
    res.send('user/login api')
    Logging.writeMessage('response to (mobileApp/user/login) ' + req.ips ,'access')
  })

}

module.exports.profile = function(req, res, next) {
  Logging.writeMessage('Access mobileApp/user/profile from ' + req.ips ,'access')
  getProfile(req.body.username, req.body.password, function(r) {
    console.log(r)
    res.send('user/profile api')
    Logging.writeMessage('response to (mobileApp/user/profile) ' + req.ips ,'access')
  })
}


var isRegister = function(userData, next) {
  var queryStatment = 'SELECT id, portalUsername, protalPassword, accessToken Where portalUsername = ?';
  var params = userData.username;
  database.query(queryStatment, params, function(err, row, field) {
    if (row.length != 1) {
      next(false)
    } else {
      next(true)
    }
  });
}

var doRegister = function(userData, next) {
  
}

var loginPortal = function(username, password, next) {
  PyScript({
    args: ['login', username, password],
    scriptFile: 'user.py'
  }, next)
}

var getProfile = function(username, password, next) {
  PyScript({
    args: ['getProfile', username, password],
    scriptFile: 'user.py'
  }, next)
}
