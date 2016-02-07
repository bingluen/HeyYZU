var rsa = require(__mobileAPIBase + 'module/rsa');
var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');

module.exports.student = function(req, res, next) {
  var messages,
    user
  ;

  /*
    Step 1 check messages is exists
   */
  if (!(req.body.messages && (messages = JSON.parse(rsa.priDecrypt(req.body.messages))))) {
    res.status(200).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
    Step 2 check params is exists
   */
  if(!messages.username || !messages.password ||
    !messages.deviceId || !messages.deviceType) {
    res.status(200).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
    Step 3 verify account
   */
  pyCarriers({
    args: ['login', messages.username, messages.password],
    scriptFile: 'catalyst.py'
  }, function(r) {
    if(r.statusCode != 200) {
      res.status(200).json({
        statusCode: r.statusCode,
        status: r.status
      });
      return;
    } else {
      user = {
        username: messages.username,
        password: messages.password,
        deviceId: messages.deviceId,
        deviceInfo: messages.deviceInfo,
      }
    }
  })
g
}
