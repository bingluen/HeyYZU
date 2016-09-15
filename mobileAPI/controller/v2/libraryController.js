"use strict"

var library = require(__mobileAPIBase + 'module/library');
var tokenHelper = require(__mobileAPIBase + 'module/token');
var user = require(__mobileAPIBase + 'module/user');
var rsa = require(__mobileAPIBase + 'module/rsa');
var helper = require(__mobileAPIBase + 'module/helper');

module.exports.search = function(req, res, next) {

  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token || !req.body.keyword || !req.body.key || !(req.body.key instanceof Array) || (typeof req.body.keyword != 'string')) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
  verifyToken(req.body.token, doSearch, res);

  /*
   * Step 3 doSearch
   */
  function doSearch() {
    library.searchLibrary(req.body.keyword, req.body.key, (result) => {
      if (result.isErr) {
        res.status(500).json({
          statusCode: 1301,
          status: 'API service internal error.'
        });
      } else {
        res.status(200).json({
          statusCode: 200,
          status: 'search successful.',
          data: result.data
        })
      }
    });
  }
}

module.exports.bookInfo = function(req, res, next) {
  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token || !req.body.bibliosno || (typeof req.body.bibliosno != 'number' && !(req.body.bibliosno instanceof Array))) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
  verifyToken(req.body.token, getBookInfo, res);

  /*
   * get book detail info
   */

  function getBookInfo() {
    var bibliosno;
    if (typeof req.body.bibliosno == 'number') {
      bibliosno = [req.body.bibliosno]
    } else {
      bibliosno = req.body.bibliosno.reduce((pv, cv) => {
        if (pv.indexOf(cv) < 0) {
          pv.push(cv);
        }
        return pv;
      }, [])
    }
    var task = bibliosno.map((r) => {
      return new Promise((reslove, reject) => {
        library.bookDetail(r, (result) => {
          if (!result.isErr) {
            reslove({
              bibliosno: r,
              data: result.data
            });
          } else {
            reject();
          }
        });
      });
    });

    Promise.all(task).then((result) => {
      res.status(200).json({
        statusCode: 200,
        status: 'Get book info.',
        result: result
      });
      return
    }, (err) => {
      res.status(500).json({
        statusCode: 1301,
        status: 'Portal Server error'
      });
      return;
    });

  }

}

module.exports.loanRecord = function(req, res, next) {
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

  var period = (req.body.period == 'current') ? req.body.period : (req.body.period == 'history') ? req.body.period : 'current';

  /*
   * step 2 Verify Token
   */
  verifyToken(req.body.token, getLoan, res);

  /*
   * step 3 call crawler
   */
  function getLoan(r) {
    /*
     * step 3 - 1 Get username & password
     */
    user.studentProfile(r.uid, (r) => {

      if (r.isErr) {
        res.status(500).json({
          statusCode: helper.Status.internal2Res(r.statusCode),
          status: helper.Status.message(r.statusCode)
        })
        return;
      }
      /*
       * step 3 - 2 get loanRecord
       */
      library.loanRecord({
        username: r.data.portalUsername,
        password: rsa.priDecrypt(r.data.portalPassword)
      }, period, (r) => {
        res.status(200).json({
          statusCode: helper.Status.internal2Res(r.statusCode),
          status: helper.Status.message(r.statusCode),
          data: r.data
        });
      })
    })
  }
}

module.exports.getCollection = (req, res, next) => {
  /**
   * step 1 Check request params is currect
   */
  if (!req.query.token) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
  let tokenVerify = new Promise((reslove, reject) => {
    verifyToken(req.query.token, (r) => {
      reslove(r);
    }, res);
  })

  tokenVerify.then((r) => {
    return library.collection.find(r.uid)
  })
  .then(
    (resloveTask) => {
      res.status(helper.Status.internal2Res(resloveTask.statusCode))
        .json({
          statusCode: helper.Status.internal2Res(resloveTask.statusCode),
          status: helper.Status.message(resloveTask.statusCode),
          data: resloveTask.data
        })
    },
    (rejectTask) => {
      res.status(helper.Status.internal2Res(rejectTask.statusCode))
        .json({
          statusCode: helper.Status.internal2Res(rejectTask.statusCode),
          status: helper.Status.message(rejectTask.statusCode)
        })
    }
  );

}


module.exports.add2Collection = (req, res, next) => {
  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token ||
      !req.body.books ||
      !(req.body.books instanceof Array)) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
  let tokenVerify = new Promise((reslove, reject) => {
    verifyToken(req.body.token, (r) => {
      reslove(r);
    }, res);
  })

  tokenVerify.then((r) => {
    return library.collection.insert(r.uid, req.body.books)
  })
  .then(
    (resloveTask) => {
      res.status(helper.Status.internal2Res(resloveTask.statusCode))
        .json({
          statusCode: helper.Status.internal2Res(resloveTask.statusCode),
          status: helper.Status.message(resloveTask.statusCode),
          data: resloveTask.data
        })
    },
    (rejectTask) => {
      res.status(helper.Status.internal2Res(rejectTask.statusCode))
        .json({
          statusCode: helper.Status.internal2Res(rejectTask.statusCode),
          status: helper.Status.message(rejectTask.statusCode)
        })
        ;
    }
  );
}

module.exports.removeFromCollection = (req, res, next) => {
  /**
   * step 1 Check request params is currect
   */
  if (!req.body.token ||
      !req.body.books ||
      !(req.body.books instanceof Array)) {
    res.status(400).json({
      statusCode: 1101,
      status: 'Params illegal'
    });
    return;
  }

  /*
   * step 2 Verify Token
   */
  let tokenVerify = new Promise((reslove, reject) => {
    verifyToken(req.body.token, (r) => {
      reslove(r);
    }, res);
  })

  tokenVerify.then((r) => {
    return library.collection.delete(r.uid, req.body.books)
  })
  .then(
    (resloveTask) => {
      res.status(helper.Status.internal2Res(resloveTask.statusCode))
        .json({
          statusCode: helper.Status.internal2Res(resloveTask.statusCode),
          status: helper.Status.message(resloveTask.statusCode),
          data: resloveTask.data
        })
    },
    (rejectTask) => {
      res.status(helper.Status.internal2Res(rejectTask.statusCode))
        .json({
          statusCode: helper.Status.internal2Res(rejectTask.statusCode),
          status: helper.Status.message(rejectTask.statusCode)
        })
    }
  );
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
