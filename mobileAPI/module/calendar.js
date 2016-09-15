"use strict"
var dbHelper = require(__mobileAPIBase + 'module/dbHelper');

module.exports.getCalendar = (filters) => {
  let currentYear = new Date(Date()).getYear();
  let currentMonth = new Date(Date()).getMonth();
  let key = {
    year: Number.parseInt(filters.year, 10) || currentYear,
    month: Number.parseInt(filters.month, 10) || currentMonth,
  }

  key.year = key.year < currentYear ? key.year : currentYear;
  key.month = key.year < currentYear ? key.month : key.month < currentMonth ? key.month : currentMonth

  let queryStatement = "SELECT * FROM calendar WHERE event_start >= ?;"
  let queryParams = [key.year + '-' + key.month + '-01']

  return new Promise((reslove, reject) => {
    let query = dbHelper.query(queryStatement, queryParams, (err, result, field) => {
      if (err) {
        reject(err);
      } else {
        reslove(result);
      }
    })
  })
}
