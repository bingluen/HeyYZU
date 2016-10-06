"use strict"

const libraryModel = require(__mobileAPIBase + 'module/v3/library');

const v2Referrals = require(__mobileAPIBase + 'module/v3/v2Referrals');

function getProp(obj, prop) {
  if (obj.hasOwnProperty(prop)) return obj[prop];
  else throw new ReferenceError('The value `' + prop +
    '` is not exist');
}

module.exports = {
  doSearch: (req, res, next) => {
    let key = {};
    try {
      key.type = getProp(req.query, "keyType");
      key.keyword = getProp(req.query, "keyword");
    } catch (e) {
      if (e instanceof ReferenceError) {
        res.status(400).json({
          statusCode: 1101,
          status: "Params illegal.",
          error: e.toString().replace("ReferenceError: ", ""),
          debug: req.debug
        });
        return;
      }
    }

    libraryModel
      .search(key.type, key.keyword)
      .then(
        (resolveTask) => {
          if (req.debug) {
            res.status(200).json({
              data: resolveTask,
              debug: req.debug
            });
          } else {
            res.status(200).json(resolveTask);
          }
        },
        (rejectTask) => {
          res.status(rejectTask.httpStatus).json({
            statusCode: rejectTask.statusCode,
            status: rejectTask.status,
            error: rejectTask.error,
            debug: req.debug
          });
        }
      )
    ;

  },
  getBookStatus: (req, res, next) => {
    let legalMediaType = ['book', 'periodical', 'media'];
    if (!req.params.mediaType || legalMediaType.indexOf(req.params.mediaType) < 0) {
      next();
      return;
    }
    libraryModel
      .bookStatus(Number.parseInt(getProp(req.params, "bibliosno"), 10), req.params.mediaType)
      .then(
        (resolveTask) => {
          if (req.debug) {
            res.status(200).json({
              data: resolveTask,
              debug: req.debug
            });
          } else {
            res.status(200).json(resolveTask);
          }
        },
        (rejectTask) => {
          res.status(rejectTask.httpStatus).json({
            statusCode: rejectTask.statusCode,
            status: rejectTask.status,
            error: rejectTask.error,
            debug: req.debug
          });
        }
      )
    ;
  },
  getLoanRecord: (req, res, next) => {
    let postData = {};
    if (req.params.type === "reading") {
      postData.token = req.query.token;
    } else if(req.params.type === "read") {
      postData.token = req.query.token;
      postData.period = "history";
    } else {
      res.status(400).json({
        status: "Params illegal.",
        statusCode: 1101
      })
      return;
    }

    v2Referrals.libraryLoanRecord(postData)
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          let bookRegex = /圖書/;
          let periodicalRegex = /期刊/;
          let ebookRegex = /電子書/
          let attachRegex = /附件/;
          let response = resolve.data;
          response.forEach((cv) => {
            delete cv.sn;
            cv.loanDate = (new Date(cv.loanDate[0])).toISOString();
            cv.dueDate = (new Date(cv.dueDate)).toISOString();
            cv.type = cv.type.match(bookRegex) ? 'book' : cv.type.match(periodicalRegex) ? 'periodical' : cv.type.match(ebookRegex) ? 'ebook' : cv.type.match(attachRegex) ? 'attach' : 'media';
          });
          res.status(resolve.httpStatus).json(response);
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
      });
  },
  getBookInfo: (req, res, next) => {
    return libraryModel.bookInfo(Number.parseInt(getProp(req.params, "bibliosno"), 10)).then((resolveTask) => {
      if (req.debug) {
        res.status(200).json({
          data: resolveTask,
          debug: req.debug
        });
      } else {
        res.status(200).json(resolveTask);
      }
    }, (rejectTask) => {
      res.status(rejectTask.httpStatus).json({
        statusCode: rejectTask.statusCode,
        status: rejectTask.status,
        error: rejectTask.error,
        debug: req.debug
      });
    });
  },
  getCollection: (req, res, next) => {
    v2Referrals.libraryGetCollection(req.query.token)
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          res.status(resolve.httpStatus).json(resolve.data.map((cv) => cv.book_bibliosno));
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
      });
  },
  add2Collection: (req, res, next) => {
    v2Referrals.libraryAddCollection(req.body)
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          res.status(resolve.httpStatus).json({msg: "success."});
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
      });
  },
  removeFromCollection: (req, res, next) => {
    v2Referrals.libraryRemoveCollection(req.body)
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          res.status(resolve.httpStatus).json({msg: "success."});
        } else {
          res.status(resolve.httpStatus).json({
            statusCode: resolve.statusCode,
            status: resolve.status
          });
        }
      });
  },
  getDashboard: (req, res, next) => {
    let token = req.query.token;
    let resData = {};

    let getCollection = v2Referrals.libraryGetCollection(token).then((resolveTask) => {
      let task = resolveTask.data.map((cv) => cv.book_bibliosno)
        .map((cv) => {
          return libraryModel.bookInfo(cv)
        });
      return Promise.all(task).then((resolveTask) => {
        resData.collection = resolveTask;
      }, (rejectTask) => {
        console.log(rejectTask);
      });
    });

    let getReadingBook = v2Referrals.libraryLoanRecord({token: token})
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          let bookRegex = /圖書/;
          let periodicalRegex = /期刊/;
          let ebookRegex = /電子書/
          let attachRegex = /附件/;
          let response = resolve.data;
          response.forEach((cv) => {
            delete cv.sn;
            cv.loanDate = (new Date(cv.loanDate[0])).toISOString();
            cv.dueDate = (new Date(cv.dueDate)).toISOString();
            cv.type = cv.type.match(bookRegex) ? 'book' : cv.type.match(periodicalRegex) ? 'periodical' : cv.type.match(ebookRegex) ? 'ebook' : cv.type.match(attachRegex) ? 'attach' : 'media';
          });
          resData.reading = response;
          return Promise.resolve();
        } else {
          return Promise.reject();
        }
      })
    ;

    let getReadBook = v2Referrals.libraryLoanRecord({token: token, period: 'history'})
      .then((resolve) => {
        if (resolve.httpStatus === 200) {
          let bookRegex = /圖書/;
          let periodicalRegex = /期刊/;
          let ebookRegex = /電子書/
          let attachRegex = /附件/;
          let response = resolve.data;
          response.forEach((cv) => {
            delete cv.sn;
            cv.loanDate = (new Date(cv.loanDate[0])).toISOString();
            cv.dueDate = (new Date(cv.dueDate)).toISOString();
            cv.type = cv.type.match(bookRegex) ? 'book' : cv.type.match(periodicalRegex) ? 'periodical' : cv.type.match(ebookRegex) ? 'ebook' : cv.type.match(attachRegex) ? 'attach' : 'media';
          });
          resData.read = response;
          return Promise.resolve();
        } else {
          return Promise.reject();
        }
      })
    ;

    Promise.all([getCollection, getReadingBook, getReadBook])
      .then(() => {
        res.status(200).json(resData);
      }, () => {
        res.status(500).json({
          msg: "Internal error"
        })
      })
    ;
  }
}
