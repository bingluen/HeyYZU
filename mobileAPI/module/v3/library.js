"use strict"

const request = require('request')

const KEY_TYPE_ERROR = { httpStatus: 400, statusCode: 2301, status: "KeyType error.", error: "KeyType error."};
const BIBLIOSNO_TYPE_ERROR = { httpStatus: 400, statusCode: 2301, status: "KeyType error.", error: "bibliosno is illegal"};
const REQUEST_ERROR = { httpStatus: 500, statusCode: 1301, status: "Request error."};
const REQUEST_INTENRAL_ERROR = {httpStatus: 500, statusCode: 1304, status: "Library server internal error."};
const NOT_FOUND_BOOK = { httpStatus: 404, statusCode: 404, status: "Not found book.", error: "book is not exists."};


const SEARCH_API = "http://unipop.yzu.edu.tw/OpenAPI/api/lib/keyword/";
const BOOKINFO_API = "http://unipop.yzu.edu.tw/OpenAPI/api/lib/Holding/";

function LibraryException(errorObject) {
  this.httpStatus = errorObject.httpStatus;
  this.statusCode = errorObject.statusCode;
  this.status = errorObject.status;
  this.error = errorObject.error;
}

module.exports = {
  search: (keyType, key) => {
    let legalKey = [
      'title_begin', 'title', 'author', 'publisher',
      'serials', 'subject', 'ISBN', 'ISSN'
    ];

    if (legalKey.indexOf(keyType) < 0) {
      return new Promise((reslove) => {
        throw new LibraryException(KEY_TYPE_ERROR);
      });
    }

    let doSearch = new Promise((resolve) => {
      let dataStream = ""
      request
        .get(SEARCH_API + keyType + '=' + encodeURI(key))
        .on('response', (response) => {
          response
            .on('data', (chunk) => {
              dataStream += chunk;
            })
            .on('end', () => {
              resolve(dataStream)
            })
          ;
        })
        .on('error', (error) => {
          let err = REQUEST_ERROR;
          err.error = error.toString();
          throw new LibraryException(err);
        })
      ;
    });

    return doSearch
      .then((resolveTask) => {
        // re-parse
        try {
          resolveTask = JSON.parse(resolveTask);
        } catch (e) {
          throw new LibraryException(REQUEST_INTENRAL_ERROR);
        }
        // adjust structure
        resolveTask = resolveTask.map((cv) => ({
          bibliosno: cv.bibliosno,
          title: cv.bktitle,
          author: cv.author,
          publishYear: parseInt(cv.publish_YY.replace(/[^0-9]/g, ''), 10) || -1,
          callNo: cv.ccl.replace(/<br>| /g, ''),
          type: cv.material_type,
          ISBN: parseInt(cv.ISBN.replace(/[^0-9]/g, ''), 10) || -1,
          ISSN: parseInt(cv.ISSN.replace(/[^0-9]/g, ''), 10) || -1,
          cover: cv.Cover,
          publish: cv.Publish
        }));
        resolveTask.sort((a, b) => (b.publishYear - a.publishYear));
        return resolveTask;
      })
      ;
  },
  bookInfo: (bibliosno) => {
    if(Number.isInteger(bibliosno)) {
      return new Promise((reslove) => {
        throw new LibraryException(BIBLIOSNO_TYPE_ERROR);
      });
    }

    let getBookInfo = new Promise((resolve) => {
      let dataStream = ""
      request
        .get(BOOKINFO_API + bibliosno.toString())
        .on('response', (response) => {
          response
            .on('data', (chunk) => {
              dataStream += chunk;
            })
            .on('end', () => {
              resolve(dataStream)
            })
          ;
        })
        .on('error', (error) => {
          let err = REQUEST_ERROR;
          err.error = error.toString();
          throw new LibraryException(err);
        })
      ;
    });

    return getBookInfo
      .then(
        (resolveTask) => {
          // re-parse
          try {
            resolveTask = JSON.parse(resolveTask);
          } catch (e) {
            throw new LibraryException(REQUEST_INTENRAL_ERROR);
          }

          // ajdust structure
          resolveTask.map((r) => {
            if (r.ColumnType && r.ColumnType == 'B') {
              return {
                columnType: 1,
                callNum: r.Callno,
                type: r.MaterialType,
                status: r.ShowStatus,
                position: r.SublibraryC,
                collection: r.CollectionC,
                info: {
                  dueDate: r.RealDueDate,
                  requestPeople: r.RequestCount
                },
                publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                cover: r.Cover,
                ISBN: parseInt(r.ISBN.replace(/[^0-9]/g, ''), 10) || -1,
                ISSN: parseInt(r.ISSN.replace(/[^0-9]/g, ''), 10) || -1
              }
            } else if (r.ColumnType && r.ColumnType == 'S') {
              return {
                columnType: 2,
                callNum: r.CallNo,
                type: r.MaterialTypeC,
                status: r.StatusC,
                position: r.sublibraryC,
                collection: r.CollectionC,
                info: {
                  vol: r.volumn,
                  publishDate: r.IssueDate
                },
                publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                cover: r.Cover,
                ISBN: parseInt(r.ISBN.replace(/[^0-9]/g, ''), 10) || -1,
                ISSN: parseInt(r.ISSN.replace(/[^0-9]/g, ''), 10) || -1
              }
            } else if (r.ColumnType && r.ColumnType == 'V') {
              return {
                columnType: 3,
                callNum: null,
                type: r.AVMaterialType,
                status: null,
                position: null,
                collection: null,
                info: {
                  publishDate: r.dateStr
                },
                publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                cover: r.Cover,
                ISBN: parseInt(r.ISBN.replace(/[^0-9]/g, ''), 10) || -1,
                ISSN: parseInt(r.ISSN.replace(/[^0-9]/g, ''), 10) || -1
              }
            } else if (r.ColumnType && r.ColumnType == 'N') {
              throw new LibraryException(NOT_FOUND_BOOK);
            }
          })

          return resolveTask;
        }
      )
    ;
  }
};
