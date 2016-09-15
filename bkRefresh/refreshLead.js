var dbHelper = require( __mobileAPIBase + 'module/dbHelper');
var rsa = require(__mobileAPIBase + 'module/rsa');
var pyCarriers = require( __mobileAPIBase + 'module/pyCarriers');
var tokenHelper = require( __mobileAPIBase + 'module/token');


module.exports = (taskPackage) => {
  return getAuthInfo(taskPackage)
  .then(
    (sloveTask) => {
      return authUser(sloveTask)
    },
    (unsloveTask) => {
      console.error(
        "[refreshLead]",
        (new Date(Date.now())).toISOString(),
        'Occure error on getAuthInfo',
        unsloveTask
      );
    }
  )
  .then(
    (sloveTask) => {
      return new Promise((slove, unslove) => {
        removeUnauthUser(sloveTask, slove, unslove);
      })
    },
    (unsloveTask) => {
      console.error(
        "[refreshLead]",
        (new Date(Date.now())).toISOString(),
        'Occure error on authUser',
        unsloveTask
      );
    }
  )
  .then(
    (sloveTask) => {
      return Promise.resolve(sloveTask);
    },
    (unsloveTask) => {
      console.error(
        "[refreshLead]",
        (new Date(Date.now())).toISOString(),
        'Occure error on removeUnauthUser'
      );
      console.error(
        "[refreshLead]",
        (new Date(Date.now())).toISOString(),
        unsloveTask.msg
      );
      console.error(
        "[refreshLead]",
        (new Date(Date.now())).toISOString(),
        unsloveTask.query.sql
      );
    }
  )
  ;
}

function getAuthInfo(taskPackage) {
  return new Promise((resolve,reject)=>{

    var query = "SELECT user_uid, portalUsername, portalPassword FROM student WHERE user_uid in (";
    taskPackage.forEach((cv, i, arr) => {
      query += cv.user_uid;
      if ( i < arr.length - 1 ) {
        query += ", "
      }
    })
    query += ");"

    var qs = dbHelper.query(query, null, (err, result) => {
      if (err) {
        reject(qs)
      } else {
        taskPackage = taskPackage.map((cv, i, arr) => {
          var user = result.filter((v) => {
            return v.user_uid == cv.user_uid;
          })[0];
          cv.portalUsername = user.portalUsername;
          cv.portalPassword = rsa.priDecrypt(user.portalPassword);
          return cv;
        });

        resolve(taskPackage)
      }
    })
  })
}

function authUser(taskPackage) {
  return Promise.all(taskPackage.map((cv) => {
    return new Promise((resolve, reject) => {
      pyCarriers({
        args:[
          'login',
          cv.portalUsername,
          cv.portalPassword
        ],
        scriptFile: 'catalyst.py'
      }, (result) => {
        if (result.statusCode != 3100) {
          cv.isInvaild = true;
          resolve(cv)
        } else {
          resolve(cv)
        }
      })
    });
  }));
}

function removeUnauthUser(taskPackage, resolve, reject) {
  var uids = taskPackage.reduce((pv, cv) => {
    if (cv.isInvaild) { pv.push(cv.user_uid) }
    return pv;
  }, []);

  taskPackage = taskPackage.filter((v) => {
    return !v.isInvaild;
  })

  if (uids.length === 0) {
    resolve(taskPackage);
  } else {
    tokenHelper.invalidateToken(uids, (r) => {
      if (r.isErr) {
        reject(r);
      } else {
        resolve(taskPackage);
      }
    });
  }
}
