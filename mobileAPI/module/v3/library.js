"use strict"

const request = require('request')

const KEY_TYPE_ERROR = { httpStatus: 400, statusCode: 2301, status: "KeyType error.", error: "KeyType error."};
const BIBLIOSNO_TYPE_ERROR = { httpStatus: 400, statusCode: 2301, status: "KeyType error.", error: "bibliosno is illegal"};
const REQUEST_ERROR = { httpStatus: 500, statusCode: 1301, status: "Request error."};
const REQUEST_INTENRAL_ERROR = {httpStatus: 500, statusCode: 1304, status: "Library server internal error."};
const NOT_FOUND_BOOK = { httpStatus: 404, statusCode: 404, status: "Not found book.", error: "book is not exists."};


const SEARCH_API = "http://unipop.yzu.edu.tw/OpenAPI/api/lib/keyword/";
const BOOKSTATUS_API = "http://unipop.yzu.edu.tw/OpenAPI/api/lib/Holding/";
const BOOKINFO_API = "http://unipop.yzu.edu.tw/OpenAPI/api/lib/keyword/SYS="

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
      return new Promise((resolve) => {
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

        if (!resolveTask.length) {
          throw new LibraryException(REQUEST_INTENRAL_ERROR);
        }

        let bookRegex = /圖書/;
        let periodicalRegex = /期刊/;
        let ebookRegex = /電子書/
        // adjust structure
        resolveTask = resolveTask.map((cv) => ({
          bibliosno: cv.bibliosno,
          title: cv.bktitle,
          author: cv.author,
          publishYear: parseInt(cv.publish_YY.replace(/[^0-9]/g, ''), 10) || -1,
          callNo: cv.ccl,
          type: cv.material_type.match(bookRegex) ? 'book' : cv.material_type.match(periodicalRegex) ? 'periodical' : cv.material_type.match(ebookRegex) ? 'ebook' : 'media',
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
  bookStatus: (bibliosno, type) => {
    if(!Number.isInteger(bibliosno)) {
      return new Promise((resolve) => {
        throw new LibraryException(BIBLIOSNO_TYPE_ERROR);
      });
    }

    let getBookStatus = new Promise((resolve) => {
      let dataStream = ""
      request
        .get(BOOKSTATUS_API + bibliosno.toString())
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

    return getBookStatus
      .then(
        (resolveTask) => {
          // re-parse
          try {
            resolveTask = JSON.parse(resolveTask);
          } catch (e) {
            throw new LibraryException(REQUEST_INTENRAL_ERROR);
          }

          // ajdust structure
          resolveTask = resolveTask.reduce((pv, r) => {
            if (r.ColumnType && r.ColumnType == 'B') {
              if (type == 'book' && (r.MaterialType == '圖書' || r.MaterialType == '附件')) {
                pv.push({
                  callNum: r.Callno,
                  type: r.MaterialType,
                  status: r.ShowStatus,
                  position: r.SublibraryC,
                  collection: r.CollectionC,
                  dueDate: r.RealDueDate,
                  requestPeople: r.RequestCount,
                  publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                  cover: r.Cover,
                  ISBN: parseInt(r.ISBN.replace(/[^0-9]/g, ''), 10) || -1,
                })
              } else if (type == 'media' && r.MaterialType != '圖書' && r.MaterialType != '附件') {
                pv.push({
                  callNum: r.Callno,
                  type: r.MaterialType,
                  status: r.ShowStatus,
                  position: r.SublibraryC,
                  collection: r.CollectionC,
                  dueDate: r.RealDueDate,
                  requestPeople: r.RequestCount,
                  publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                  cover: r.Cover,
                })
              }

            } else if (type == 'periodical' && r.ColumnType && r.ColumnType == 'S') {
              pv.push({
                callNum: r.CallNo,
                type: r.MaterialTypeC,
                status: r.StatusC,
                position: r.sublibraryC,
                collection: r.CollectionC,
                vol: r.volumn,
                publishDate: r.IssueDate,
                publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                cover: r.Cover,
                ISSN: parseInt(r.ISSN.replace(/[^0-9]/g, ''), 10) || -1
              });
            } else if (type == 'media' && r.ColumnType && r.ColumnType == 'V') {
              pv.push({
                type: r.AVMaterialType,
                publishDate: r.dateStr,
                publisher: r.Publish.replace(/(<([^>]+)>)/ig, ""),
                cover: r.Cover,
              });
            } else if (r.ColumnType && r.ColumnType == 'N') {
              throw new LibraryException(NOT_FOUND_BOOK);
            }
            return pv;
          }, [])

          if (resolveTask.length == 0) {
            throw new LibraryException(NOT_FOUND_BOOK);
          }

          return resolveTask;
        }
      )
    ;
  },
  bookInfo: (bibliosno) => {
    if(!Number.isInteger(bibliosno)) {
      return new Promise((resolve) => {
        throw new LibraryException(BIBLIOSNO_TYPE_ERROR);
      });
    }


    let getBookinfo = new Promise((resolve) => {
      let dataStream = "";
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

    return getBookinfo
      .then((resolveTask) => {
        // re-parse
        try {
          resolveTask = JSON.parse(resolveTask);
        } catch (e) {
          throw new LibraryException(REQUEST_INTENRAL_ERROR);
        }

        let bookRegex = /圖書/;
        let periodicalRegex = /期刊/;
        let ebookRegex = /電子書/
        // adjust structure
        resolveTask = resolveTask.map((cv) => ({
          bibliosno: cv.bibliosno,
          title: cv.bktitle,
          author: cv.author,
          publishYear: parseInt(cv.publish_YY.replace(/[^0-9]/g, ''), 10) || -1,
          callNo: cv.ccl,
          type: cv.material_type.match(bookRegex) ? 'book' : cv.material_type.match(periodicalRegex) ? 'periodical' : cv.material_type.match(ebookRegex) ? 'ebook' : 'media',
          ISBN: parseInt(cv.ISBN.replace(/[^0-9]/g, ''), 10) || -1,
          ISSN: parseInt(cv.ISSN.replace(/[^0-9]/g, ''), 10) || -1,
          cover: cv.Cover,
          publish: cv.Publish
        }));

        return resolveTask[0];
      })
      ;
  }
};
