"use strict"

const libraryModel = require(__mobileAPIBase + 'module/v3/library');

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
      .bookStatus(getProp(req.params, "bibliosno"), req.params.mediaType)
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
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  getBookInfo: (req, res, next) => {
    return libraryModel.bookInfo(getProp(req.params, "bibliosno")).then((resolveTask) => {
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
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  add2Collection: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  removeFromCollection: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  }
}
