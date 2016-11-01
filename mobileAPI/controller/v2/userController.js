var tokenHelper = require( __mobileAPIBase + 'module/token');
var user = require( __mobileAPIBase + 'module/user');
var rsa = require(__mobileAPIBase + 'module/rsa');
var helper = require(__mobileAPIBase + 'module/helper');

module.exports.studentProfile = function(req, res, next) {
  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
   verifyToken(req.body.token, getStudentProfile, res);

   /*
    * step 3 student profile
    */
   function getStudentProfile(userData) {
     user.studentProfile(userData.uid, function(result) {
       if (result.isErr) {
         res.status(500).json({
           statusCode: 1201,
           status: 'API service internal error.'
         });
       }
       else {
         res.status(200).json({
           statusCode: 200,
           status: 'get student profile successful.',
           data: {
             chiName: result.data.chiName,
             engName: result.data.engName,
             deptName: result.data.temp_deptName
           }
         });
       }
     })
   }
}

module.exports.studentCourse = function(req, res, next) {
  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
   verifyToken(req.body.token, getStudentCourse, res);

   function getStudentCourse(userData) {
     user.studentCourse(userData.uid, function(result) {
       if (result.isErr) {
         res.status(500).json({
           statusCode: 1201,
           status: 'API service internal error.'
         });
       }
       else {
         res.status(200).json({
           statusCode: 200,
           status: 'get student course successful.',
           data: result.data
         });
       }
     })
   }
}

module.exports.refreshStudentCourse = function(req, res, next) {
  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
   verifyToken(req.body.token, refresh, res);

   function refresh(r) {
     user.isAllowRefreshCourse(r.uid, (isAllow) => {
       if (isAllow) {
         user.studentProfile(r.uid, (user_data) => {
           if (user_data.isErr) {
             res.status(500).json({
               statusCode: 1201,
               status: 'API service internal error.'
             });
             return;
           }

           user.updateCourseHistory({
             id: r.uid,
             username: user_data.data.portalUsername,
             password: rsa.priDecrypt(user_data.data.portalPassword)
           }, (result) => {
             if(result.isErr) {
              res.status().json({
                statusCode: helper.Status.internal2Res(result.statusCode),
                status: helper.Status.message(result.statusCode)
              });
             } else {
               res.status(200).json({
                 statusCode: 200,
                 status: 'Course history update successful !'
               });
             }
           });
         });
       } else {
         res.status(200).json({
           statusCode: 200,
           status: 'Course history update is too frequently !'
         });
       }
     });
   }
}

function verifyToken(token, next, res) {
  tokenHelper.verifyToken(token, function(err, result) {
    if (err) {
      console.error((new Date(Date.now())).toISOString(), 'Occure error when verify token.');
      console.error((new Date(Date.now())).toISOString(), err);
      res.status(500).json({
        statusCode: 1201,
        status: 'API service internal error.'
      });
      return;
    }
    if (result.isVaild) {
      next(result)
    } else {
      res.status(400).json({
        statusCode: 1102,
        status: 'token is invaild.',
        isVaild: false
      });
      return;
    }
  });
}
