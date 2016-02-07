var PythonShell = require('python-shell');

module.exports = function (option, next) {
  if(option) {
    var PyOptions = {
      mode: option.returnFormat || 'json',
      scriptPath: option.path || __SystemBase + 'pyScript/',
      args: option.args

    }
    PythonShell.run(option.scriptFile, PyOptions, function (err, results) {
      if(!err)
        next(results[0]);
      else
      {
        next({err: "Can't run python script : " + PyOptions.scriptPath + option.scriptFile  + ' and error message: ' + err})
      }
    });
  }
}
