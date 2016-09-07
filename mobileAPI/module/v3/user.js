"use strict"

const dbModule = require(__mobileAPIBase + 'module/v3/db');

function findUser(username) {
  return new Promise((resolve) => {
    let query = dbModule.query(
      "SELECT * FROM user WHERE username = ?;",
      [username],
      (err, result, field) => {
        if (err) {
          throw new dbModule.QueryException(err);
        } else if (result.length > 0) {
          resolve(result[0]);
        } else {
          resolve(null);
        }
      }
    );
  });
}

function createNewUser(newUser) {
  return new Promise((resolve) => {
    let query = dbModule.query(
      "INSERT INTO user SET ?;",
      newUser,
      (err, row, field) => {
        if (err) {
          throw new dbModule.QueryException(err);
        } else {
          newUser.uid = row.insertId;
          resolve(newUser);
        }
      }
    );
  });
}

function updatePassword(uid, password) {
  return new Promise((resolve) => {
    let query = dbModule.query(
      "UPDATE user SET password = ? WHERE uid = ?;",
      [password, uid],
      (err, row, field) => {
        if (err) {
          throw new dbModule.QueryException(err);
        } else {
          resolve();
        }
      }
    );
  });
}

module.exports = {
  find: findUser,
  create: createNewUser,
  updatePw: updatePassword
}
