"use strict"

const request = require('request')

const KEY_TYPE_ERROR = { httpStatus: 400, statusCode: 2301, status: "KeyType error.", error: "KeyType error."};
const REQUEST_ERROR = { httpStatus: 500, statusCode: 1301, status: "Request error."};
const REQUEST_INTENRAL_ERROR = {httpStatus: 500, statusCode: 1304, status: "Library server internal error."};
const SEARCH_API = "http://unipop.yzu.edu.tw/OpenAPI/api/lib/keyword/";

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
      throw new LibraryException(KEY_TYPE_ERROR);
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
        console.log(resolveTask);
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
      .then(
      (resolveTask) => {
        return resolveTask;
      }
    );
  }
}
