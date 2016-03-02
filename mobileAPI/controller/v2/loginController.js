var rsa = require(__mobileAPIBase + 'module/rsa');
var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');
var dbHelper = require( __mobileAPIBase + 'module/dbHelper');
var tokenHelper = require( __mobileAPIBase + 'module/token');

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
    !messages.deviceId || !messages.deviceInfo ||
    !messages.deviceMAC || !messages.deviceInfo.os ||
    !messages.deviceInfo.osVer || ! messages.deviceInfo.device) {
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
        deviceMAC: messages.deviceMAC,
        deviceInfo: messages.deviceInfo
      }

      isRegistered();
    }
  })

  /*
    Step 4 check user is registered or not
   */
  function isRegistered() {
    var queryStatement = "SELECT user_uid, count(*) as count FROM student WHERE portalUsername = ? LIMIT 1;";
    var queryParams = [user.username];
    var query = dbHelper.query(queryStatement, queryParams, function(err, row, field) {
      if (err) {
        console.error((new Date(Date.now())).toISOString(), 'Occure error when check user is registered or not.');
        console.error((new Date(Date.now())).toISOString(), err);
        res.status(200).json({
          statusCode: 1102,
          status: 'API service internal error.'
        });
        return;
      } else {
        if (row[0]['count'] == 0) {
          getUserData();
        } else {
          user.uid = row[0]['user_uid'];
          createToken();
        }
      }
    });
  }

  /*
    Step 4-1 get user data
   */
  function getUserData() {
    pyCarriers({
      args: ['userdata', user.username, user.password],
      scriptFile: 'catalyst.py'
    }, function(r) {
      if(r.statusCode != 200) {
        res.status(200).json({
          statusCode: r.statusCode,
          status: r.status
        });
        return;
      } else {
        var profile = r.userdata;
        profile.portalUsername = user.username;
        profile.portalPassword = rsa.pubEncrypt(user.password);
        registration(profile);
      }
    })
  }

  /*
    Step 4-2 registration
   */
  function registration(profile) {
    var queryStatement = "INSERT INTO student SET ?;";
    var queryParams = profile;
    var query = dbHelper.query(queryStatement, queryParams, function(err, row, field) {
      if (err) {
        console.error((new Date(Date.now())).toISOString(), 'Occure error when new user registration');
        console.error((new Date(Date.now())).toISOString(), err);
        res.status(200).json({
          statusCode: 1102,
          status: 'API service internal error.'
        });
        return;
      } else {
        user.uid = row.insertId;
        createToken();
      }
    });
  }



  /*
    Step 5 Create token
   */
   function createToken() {
     var cb = function(err, newToken) {
       if (err) {
         console.error((new Date(Date.now())).toISOString(), 'Occure error when create new token.');
         console.error((new Date(Date.now())).toISOString(), err);
         res.status(200).json({
           statusCode: 1102,
           status: 'API service internal error.'
         });
         return;
       } else {
         res.status(200).json({
           statusCode: 200,
           status: 'login sucessful.',
           token: newToken.token,
           tokenMfd: newToken.mfd,
           tokenExp: newToken.exp
         });
         return;
       }
     }

     tokenHelper.createToken(user, cb);
   }

}


module.exports.verifyToken = function(req, res, next) {
  /* step 1 check token column is exists */
  if (!req.body.token) {
    res.status(200).json({
      statusCode: 1101,
      status: 'token not exists'
    });
    return;
  }

  tokenHelper.verifyToken(req.body.token, function(err, result) {
    if (err) {
      console.error((new Date(Date.now())).toISOString(), 'Occure error when verify token.');
      console.error((new Date(Date.now())).toISOString(), err);
      res.status(200).json({
        statusCode: 1102,
        status: 'API service internal error.'
      });
      return;
    }
    if (result.isVaild) {
      res.status(200).json({
        statusCode: 200,
        status: 'token is vaild.',
        isVaild: true,
        tokenMfd: result.mfd,
        tokenExp: result.exp
      });
    } else {
      res.status(200).json({
        statusCode: 200,
        status: 'token is invaild.',
        isVaild: false
      });
    }
  });
}
