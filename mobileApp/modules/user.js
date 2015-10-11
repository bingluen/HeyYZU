var PythonShell = require('python-shell');

var PyOptions = {
  mode: 'json',
  scriptPath: '../pyScript/',
  args: ['QAQ', 'test']
}

PythonShell.run('user.py', PyOptions, function (err, results) {
  console.log(results[0].status)
  // results is an array consisting of messages collected during execution
});
