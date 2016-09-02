"use strict"

const requestTool = require('request')
var cookie = requestTool.jar()
const request = requestTool.defaults({jar: cookie});
const cheerio = require('cheerio');
const CrawlerException = require('./CrawlerException');
const PORTAL_LOGIN = "https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx"

module.exports = (username, password) => {
  let getLoginPage = new Promise((resolve, reject) => {
    let dataStream = "";
    request
      .get(PORTAL_LOGIN)
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
        reject(error);
      })
    ;
  });

  let parseParams = (dom) => {
    let $ = cheerio.load(dom);
    return {
      __VIEWSTATE: $("#__VIEWSTATE").val(),
      __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").val(),
      __EVENTVALIDATION: $("#__EVENTVALIDATION").val()
    }
  };

  let doLogin = (params) => {
    return new Promise((resolve, reject) => {
      let dataStream = "";
      request
        .post(PORTAL_LOGIN)
        .form({
          __VIEWSTATE: params.__VIEWSTATE,
          __VIEWSTATEGENERATOR: params.__VIEWSTATEGENERATOR,
          __EVENTVALIDATION: params.__EVENTVALIDATION,
          ibnSubmit: "登入",
          Txt_UserID: username,
          Txt_Password: password
        })
        .on('response', (response) => {
          response
            .on('data', (data) => {
              dataStream += data;
            })
            .on('end', () => {
              resolve(dataStream);
            })
        })
    })
  }

  let checkLoginResult = (dom) => {
    let successRegex = /window[.]location='[.][/]FMain[/]DefaultPage[.]aspx/
    return {
      isLogged: successRegex.test(dom),
      cookie: cookie
    }
  };

  return getLoginPage
    .then((resolveTask) => {
      return parseParams(resolveTask);
    })
    .then((resolveTask) => {
      return doLogin(resolveTask);
    })
    .then((resolveTask) => {
      return checkLoginResult(resolveTask);
    },
    (rejectTask) => {
      throw CrawlerException(rejectTask);
    })
    ;
}
