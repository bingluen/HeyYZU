var PyScript = require(__MobileAppBase + 'mobileApp/modules/runPython');
var Logging = require(__MobileAppBase + 'modules/logging')('mobileAPI');

module.exports.login = function(req, res, next) {

  Logging.writeMessage('Access mobileApp/user/login from ' + req.ip ,'access')
  loginPortal(req.body.username, req.body.password, function(r) {
    console.log(r)
    res.send('user/login api')
    Logging.writeMessage('response to (mobileApp/user/login) ' + req.ip ,'access')
  })

}

module.exports.profile = function(req, res, next) {
  Logging.writeMessage('Access mobileApp/user/profile from ' + req.ip ,'access')
  getProfile(req.body.username, req.body.password, function(r) {
    console.log(r)
    res.send('user/profile api')
    Logging.writeMessage('response to (mobileApp/user/profile) ' + req.ip ,'access')
  })
}


var isRegister = function() {

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
