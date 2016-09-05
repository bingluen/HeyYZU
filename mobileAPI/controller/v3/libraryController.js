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
          res.status(200).json({
            statusCode: 200,
            status: "successful.",
            data: resolveTask,
            debug: req.debug,
          });
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
  getBookInfo: (req, res, next) => {
    libraryModel
      .bookInfo(getProp(req.params, "bibliosno"))
      .then(
        (resolveTask) => {
          res.status(200).json({
            statusCode: 200,
            status: "successful.",
            data: resolveTask,
            debug: req.debug
          });
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
