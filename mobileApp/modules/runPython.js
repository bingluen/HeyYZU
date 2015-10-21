var PythonShell = require('python-shell');
var Logging = require(__MobileAppBase + 'modules/logging')('mobileAPI');


module.exports = function (option, next) {
  if(option) {
    var PyOptions = {
      mode: option.returnFormat || 'json',
      scriptPath: option.path || __MobileAppBase + 'mobileApp/pyScript/',
      args: option.args

    }
    PythonShell.run(option.scriptFile, PyOptions, function (err, results) {
      if(!err)
        next(results[0]);
      else
      {
        Logging.writeMessage('Can\'t run python script : ' + PyOptions.scriptPath + option.scriptFile + ' and error message: ' + err , 'error')
        next({err: 'Can\'t run python script : ' + PyOptions.scriptPath + option.scriptFile + ' and error message: ' + err})
      }
    });
  }
}
