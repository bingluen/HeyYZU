"use strict"

var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');
var tokenHelper = require( __mobileAPIBase + 'module/token');
var course = require( __mobileAPIBase + 'module/course');
var helper = require( __mobileAPIBase + 'module/helper');
var rsa = require( __mobileAPIBase + 'module/rsa');
var user = require( __mobileAPIBase + 'module/user');
var mime = require('mime-types')


module.exports.getCourseDetail = function(req, res, next) {

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
   verifyToken(req.body.token, getCourseDetail, res)

  /*
   * step 3 parse key & get course detail from database
   */
  function getCourseDetail(userData) {
    var key = {
      lesson_id: '',
      user_uid: userData.uid,
      year: helper.getYearNow(),
      semester: helper.getSemesterNow()
    }

    if (req.body.key) {
      if (req.body.key.lesson_id) {
          if(Number.isInteger(req.body.key.lesson_id)) {
            key.lesson_id = req.body.key.lesson_id
          }
          else if (req.body.key.lesson_id instanceof Array) {
            key.lesson_id = [];
            req.body.key.lesson_id.forEach(function(cv, i, arr) {
              if (Number.isInteger(cv)) key.lesson_id.push(cv);
            });
          }
      } else {
        if (req.body.key.year && Number.isInteger(req.body.key.year) && req.body.key.year <= key.year) {
          key.year = req.body.key.year;
        }
        if (req.body.key.semester && Number.isInteger(req.body.key.semester) && req.body.key.semester <= 3) {
          key.semester = req.body.key.semester;
        }
      }
    }

    course.information(key, responser);

  }


  /*
   * Step 4 response result to client
   */
  function responser(result) {
    if (result.isErr) {
      console.error((new Date(Date.now())).toISOString(), result.status);
      console.error((new Date(Date.now())).toISOString(), result.error);
      console.error((new Date(Date.now())).toISOString(), result.query);
      res.status(500).json({
        statusCode: 1201,
        status: 'API service internal error.'
      });
      return;
    } else {
      res.status(200).json({
        statusCode: 200,
        status: 'Get course information successful.',
        data: result.data
      })
      return;
    }
  }
}

module.exports.getCourseHomework = function(req, res, next) {
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
   verifyToken(req.body.token, getHomeworks, res)

  /*
   * step 3 parse key & get course homework from database
   */
  function getHomeworks(userData) {
    var key = {
      lesson_id: '',
      user_uid: userData.uid,
      year: helper.getYearNow(),
      semester: helper.getSemesterNow(),
      idAfter: 0
    }

    if (req.body.key) {
      if (req.body.key.lesson_id) {
          if(Number.isInteger(req.body.key.lesson_id)) {
            key.lesson_id = req.body.key.lesson_id
          }
          else if (req.body.key.lesson_id instanceof Array) {
            key.lesson_id = [];
            req.body.key.lesson_id.forEach(function(cv, i, arr) {
              if (Number.isInteger(cv)) key.lesson_id.push(cv);
            });
          }
      } else {
        if (req.body.key.year && Number.isInteger(req.body.key.year) && req.body.key.year <= key.year) {
          key.year = req.body.key.year;
        }
        if (req.body.key.semester && Number.isInteger(req.body.key.semester) && req.body.semester <= 3) {
          key.semester = req.body.key.semester;
        }
        if (req.body.key.idAfter &&
          Number.isInteger(req.body.key.idAfter) && req.body.key.idAfter > 0) {
          key.idAfter = req.body.key.idAfter;
        }
      }
    }

    course.homeworks(key, responser);

  }


  /*
   * Step 4 response result to client
   */
  function responser(result) {
    if (result.isErr) {
      console.error((new Date(Date.now())).toISOString(), result.status);
      console.error((new Date(Date.now())).toISOString(), result.error);
      console.error((new Date(Date.now())).toISOString(), result.query);
      res.status(500).json({
        statusCode: 1201,
        status: 'API service internal error.'
      });
      return;
    } else {
      res.status(200).json({
        statusCode: 200,
        status: 'Get course homeworks list successful.',
        data: result.data
      })
    }
  }

}

module.exports.getCourseNotice = function(req, res, next) {
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
   verifyToken(req.body.token, getNotices, res)

  /*
   * step 3 parse key & get course notice from database
   */
  function getNotices(userData) {
    var key = {
      lesson_id: '',
      user_uid: userData.uid,
      year: helper.getYearNow(),
      semester: helper.getSemesterNow(),
      idAfter: 0
    }

    if (req.body.key) {
      if (req.body.key.lesson_id) {
          if(Number.isInteger(req.body.key.lesson_id)) {
            key.lesson_id = req.body.key.lesson_id
          }
          else if (req.body.key.lesson_id instanceof Array) {
            key.lesson_id = [];
            req.body.key.lesson_id.forEach(function(cv, i, arr) {
              if (Number.isInteger(cv)) key.lesson_id.push(cv);
            });
          }
      } else {
        if (req.body.key.year && Number.isInteger(req.body.key.year) && req.body.key.year <= key.year) {
          key.year = req.body.key.year;
        }
        if (req.body.key.semester && Number.isInteger(req.body.key.semester) && req.body.semester <= 3) {
          key.semester = req.body.key.semester;
        }
        if (req.body.key.idAfter &&
          Number.isInteger(req.body.key.idAfter) && req.body.key.idAfter > 0) {
          key.idAfter = req.body.key.idAfter;
        }
      }
    }

    course.notices(key, responser);

  }


  /*
   * Step 4 response result to client
   */
  function responser(result) {
    if (result.isErr) {
      console.error((new Date(Date.now())).toISOString(), result.status);
      console.error((new Date(Date.now())).toISOString(), result.error);
      console.error((new Date(Date.now())).toISOString(), result.query);
      res.status(500).json({
        statusCode: 1201,
        status: 'API service internal error.'
      });
      return;
    } else {
      res.status(200).json({
        statusCode: 200,
        status: 'Get course Notices list successful.',
        data: result.data
      })
    }
  }
}

module.exports.getCourseMaterial = function(req, res, next) {
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
   verifyToken(req.body.token, getMaterial, res)

  /*
   * step 3 parse key & get course material from database
   */
  function getMaterial(userData) {
    var key = {
      lesson_id: '',
      user_uid: userData.uid,
      year: helper.getYearNow(),
      semester: helper.getSemesterNow(),
      idAfter: 0
    }

    if (req.body.key) {
      if (req.body.key.lesson_id) {
          if(Number.isInteger(req.body.key.lesson_id)) {
            key.lesson_id = req.body.key.lesson_id
          }
          else if (req.body.key.lesson_id instanceof Array) {
            key.lesson_id = [];
            req.body.key.lesson_id.forEach(function(cv, i, arr) {
              if (Number.isInteger(cv)) key.lesson_id.push(cv);
            });
          }
      } else {
        if (req.body.key.year && Number.isInteger(req.body.key.year) && req.body.key.year <= key.year) {
          key.year = req.body.key.year;
        }
        if (req.body.key.semester && Number.isInteger(req.body.key.semester) && req.body.semester <= 3) {
          key.semester = req.body.key.semester;
        }
        if (req.body.key.idAfter &&
          Number.isInteger(req.body.key.idAfter) && req.body.key.idAfter > 0) {
          key.idAfter = req.body.key.idAfter;
        }
      }
    }

    course.materials(key, responser);

  }


  /*
   * Step 4 response result to client
   */
  function responser(result) {
    if (result.isErr) {
      console.error((new Date(Date.now())).toISOString(), result.status);
      console.error((new Date(Date.now())).toISOString(), result.error);
      console.error((new Date(Date.now())).toISOString(), result.query);
      res.status(500).json({
        statusCode: 1201,
        status: 'API service internal error.'
      });
      return;
    } else {
      res.status(200).json({
        statusCode: 200,
        status: 'Get course material list successful.',
        data: result.data
      })
    }
  }
}

module.exports.getAttachment = function(req, res, next) {
  /**
   * step 1 Check request params is currect
   */
  if (!req.query.token || !req.params.id) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
   verifyToken(req.query.token, getAttach, res)

   /*
    * Step 3 look up attachment
    */

   function getAttach(userdata) {
     let task = new Promise((reslove) => {
       user.studentProfile(userdata.uid, (r) => {
         if (r.isErr) {
           res.status(500).json({
             statusCode: 1201,
             status: 'API service internal error.'
           });
         } else {
           reslove(r)
         }
       })
     });

     task.then((user) => {
       let getAttach = new Promise((reslove) => {
         course.attachments({
           attach_id: parseInt(req.params.id, 10),
           username: user.data.portalUsername,
           password: rsa.priDecrypt(user.data.portalPassword)
         }, (r) => {
           reslove(r)
         })
       })
       return getAttach;
     })
     .then((attachments) => {
       if (attachments.isErr) {
         res.status(500).json({
           statusCode: 1201,
           status: 'API service internal error.'
         });
         return;
       } else {
         res.status(200).sendFile(__attachmentPath + attachments.filename, {
           headers: {
             'Content-Type': mime.lookup(attachments.filename),
             'Content-Disposition': 'inline; filename="'+ attachments.originFilename +'"',
           }
         });
       }
     })

   }
}

function verifyToken(token, next, res) {
  tokenHelper.verifyToken(token, function(err, result) {
    if (err) {
      console.error((new Date(Date.now())).toISOString(), 'Occure error when verify token.');
      console.error((new Date(Date.now())).toISOString(), err);
      res.status(500).json({
        statusCode: 1202,
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
