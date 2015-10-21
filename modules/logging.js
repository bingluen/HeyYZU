var fs = require('fs-extra');
var path = require('path');
var moment = require('moment');

var logPath = {
  service: {
    error: 'log/service/err',
    status: 'log/service/status',
    access: 'log/service/access',
    general: 'log/service/general'
  },
  mobileAPI: {
    error: 'log/mobileAPI/err',
    status: 'log/mobileAPI/status',
    access: 'log/mobileAPI/access',
    general: 'log/mobileAPI/general'
  },
  system: {
    error: 'log/system/err',
    status: 'log/system/status',
    access: 'log/system/access',
    general: 'log/system/general'
  }
}
var logger = function(model) {
  this.path = logPath[model] || logPath.system;

  this.writeMessage = function(messages, messagesType) {
    var type = this.path[messagesType] || this.path.general;
    var logfile = fs.createOutputStream(
      path.join(__dirname, '../', type, moment().format('YYYY-MM-DD') + '-' +messagesType + '.log'),
      {
        flags: 'a+',
        defaultEncoding: 'utf8',
        fd: null,
        mode: 0o666
      }
    );
    logfile.write('[' + moment().format('YYYY-MM-DD hh:mm:ss') +'] ' + messages + '\n');
  }
}

var Logging = function(model) {
  return new logger(model);
}

module.exports = Logging;
