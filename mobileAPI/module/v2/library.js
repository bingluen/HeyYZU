"use strict"

var pyCarriers = require(__mobileAPIBase + 'module/v2/pyCarriers');
var https = require('https');
var http = require('http');
var user = require(__mobileAPIBase + 'module/v2/user');
var dbHelper = require(__mobileAPIBase + 'module/v2/dbHelper')

module.exports.searchLibrary = function(key, keyTypes, callback) {
  keyTypes = keyTypes.filter(
    cv =>
    cv == 'title_begin' ||
    cv == 'title' ||
    cv == 'author' ||
    cv == 'publisher' ||
    cv == 'serials' ||
    cv == 'subject' ||
    cv == 'ISBN' ||
    cv == 'ISSN'
  );

  var searchResult = [];

  var concatResult = (traget, items) => {
    items = items.filter((item) => {
        return traget.reduce((pv, cv) => {
          return pv && cv['bibliosno'] != item['bibliosno']
        }, true)
      })
      .map((item) => ({
        bibliosno: item.bibliosno,
        title: item.bktitle,
        author: item.author,
        publishYear: Number.parseInt(item.publish_YY) ? Number.parseInt(item.publish_YY) : 0,
        callNum: item.ccl.replace(/<br> /ig, ""),
        type: item.material_type,
        ISBN: item.ISBN,
        ISSN: item.ISSN,
        cover: item.Cover,
        publisher: item.Publish
      }))

    return traget.concat(items);
  }

  var doSearch = function(keyType, resolve, reject) {
    http.get('http://unipop.yzu.edu.tw/OpenAPI/api/lib/keyword/' + keyType + '=' + encodeURI(key), (res) => {
        var data = ''
        res.on('data', (d) => {
          data += d.toString('utf-8')
        });
        res.on('end', () => {
          data = JSON.parse(data)
          if (!(data instanceof Array)) {
            reject();
            return;
          }
          searchResult = concatResult(searchResult, data)
          resolve();
        })
      })
      .on('error', (e) => {
        console.error(e);
        reject();
      });
  }

  let requests = keyTypes.map((item) => {
    return new Promise((resolve, reject) => {
      doSearch(item, resolve, reject);
    });
  })

  Promise.all(requests).then(
    () => {
      searchResult.sort((lhs, rhs) => (rhs.publishYear - lhs.publishYear));
      searchResult.forEach((cv) => { cv.publishYear = cv.publishYear.toString() });

      callback({
        isErr: false,
        data: searchResult
      })
    }, () => {
      callback({
        isErr: true
      })
    });
}


module.exports.bookDetail = function(bibliosno, next) {

  http.get('http://unipop.yzu.edu.tw/OpenAPI/api/lib/Holding/' + bibliosno.toString(), (res) => {
    var data = ''
    res.on('data', (d) => {
      data += d.toString('utf-8');
    });
    res.on('end', () => {
        next({
          data: JSON.parse(data).map((r) => {
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
                ISBN: r.ISBN,
                ISSN: r.ISSN
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
                ISBN: r.ISBN,
                ISSN: r.ISSN
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
                ISBN: r.ISBN,
                ISSN: r.ISSN
              }
            }
          })
        });
      })
      .on('error', (e) => {
        next({
          isErr: true
        })
      });
  });

}


module.exports.loanRecord = function(user, period, next) {

  pyCarriers({
    args: ['library', user.username, user.password, 'loanList', period],
    scriptFile: 'catalyst.py'
  }, (r) => {
    if (r.statusCode != 3300) {
      next({
        isErr: true,
        statusCode: r.statusCode,
        status: r.status
      });
      return;
    } else {
      next({
        statusCode: r.statusCode,
        status: r.status,
        data: r.data.map((book) => {
          return {
            sn: book.sn,
            bibliosno: book.bibliosno,
            type: book.materialType,
            author: book.author,
            title: book.title,
            loanDate: book.loanDate,
            dueDate: book.dueDate
          }
        }),
        length: r.data.length
      });
    }
  });
}

module.exports.collection = {
  insert: (user_uid, books) => {
    return new Promise((reslove, reject) => {
      let numRegex = new RegExp("[0-9]+")
      books = books.filter((cv) => {
        return numRegex.test(cv);
      });

      if (books.length <= 0) {
        reject({
          statusCode: 3311,
          status: 'Params illegal'
        })
      }

      let queryStatement = books.reduce((pv, cv) => {
        return pv + "INSERT INTO library_collection SET ?;"
      }, "");

      let queryParams = books.map((cv) => ({
          user_uid: user_uid,
          book_bibliosno: cv
      }));

      let query = dbHelper.query(queryStatement, queryParams, (err, result, field) => {
        if (err) {
          reject({
            statusCode: 3313,
            status: 'insert failed',
            err: err
          });
        } else {
          reslove({
            statusCode: 3310,
            status: 'insert success'
          })
        }
      });
    });
  },
  delete: (user_uid, books) => {
    return new Promise((reslove, reject) => {
      let numRegex = new RegExp("[0-9]+")
      books = books.filter((cv) => {
        return numRegex.test(cv);
      });

      if (books.length <= 0) {
        reject({
          statusCode: 3311,
          status: 'Params illegal'
        })
      }

      let queryStatement = books.reduce((pv, cv) => {
        return pv + "DELETE FROM library_collection WHERE user_uid = ? and book_bibliosno = ? ;"
      }, "");

      let queryParams = books.reduce((pv, cv) => {
          pv.push(user_uid);
          pv.push(cv);
          return pv;
      }, []);

      let query = dbHelper.query(queryStatement, queryParams, (err, result, field) => {
        if (err) {
          reject({
            statusCode: 3312,
            status: 'delete failed',
            err: err
          });
        } else {
          reslove({
            statusCode: 3310,
            status: 'delete success'
          })
        }
      });

    });
  },
  find: (user_uid) => {
    return new Promise((reslove, reject) => {
      let queryStatement = "SELECT book_bibliosno FROM library_collection WHERE user_uid = ?;"

      let query = dbHelper.query(queryStatement, [user_uid], (err, result, field) => {
        if (err) {
          reject({
            statusCode: 3315,
            status: 'find failed',
            err: err
          });
        } else {
          reslove({
            statusCode: 3310,
            status: 'find success',
            data: result
          })
        }
      });
    })
  }

}
