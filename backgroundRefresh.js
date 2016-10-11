var path = require('path');
global.__mobileAPIBase = path.join(__dirname, '/mobileAPI/');
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__refreshBase = path.join(__dirname, '/bkRefresh/');
global.__SystemBase = __dirname + '/'

var homework = require(__refreshBase + 'hwRefresh');
var notice = require (__refreshBase + 'noticeRefresh');
var material = require(__refreshBase + 'materialRefresh');

var timeInterval = 15 * 60 * 1000

function task() {
  console.log(
    "----------------------------------------------------------------"
  );
  console.log(
    "[backgroundRefresh]",
    (new Date(Date.now())).toISOString(),
    '開始進行資料庫更新'
  );
  return homework(true)
  .then(
    (reslove) => {
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        'Homework refresh Done'
      );
      return material();
    },
    (reject) => {
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        'Homework refresh reject'
      );
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        reject
      );
    }
  )
  .then(
    (reslove) => {
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        'material refresh Done'
      );
      return notice();
    },
    (reject) => {
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        'material refresh reject'
      );
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        reject
      );
    }
  )
  .then(
    (reslove) => {
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        'notice refresh Done'
      );
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        '資料庫更新完畢'
      );
    },
    (reject) => {
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        'notice refresh reject'
      );
      console.log(
        "[backgroundRefresh]",
        (new Date(Date.now())).toISOString(),
        reject
      );
    }
  )
}

//task();
setInterval(task, timeInterval);
