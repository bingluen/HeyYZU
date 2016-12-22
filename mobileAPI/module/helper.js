var moment = require('moment-timezone');

module.exports.getYearNow = function()
{
  var nowTime = new Date(Date.now());
  var year = nowTime.getYear() - 11;
  if(nowTime.getMonth() <= 7) return year - 1;
  else return year;
}

module.exports.getSemesterNow = function()
{
  var nowTime = new Date(Date.now());
  var month = nowTime.getMonth();

  if(month <= 7 && month >= 2) return 2;
  else return 1;
}

module.exports.getCurrentDay = () =>
{
  var nowTime = new Date(Date.now());
  return moment.tz(nowTime, "Asia/Taipei").format("DD");
}

module.exports.getCurrentHour = () =>
{
  
  var nowTime = new Date(Date.now());
  return moment.tz(nowTime, "Asia/Taipei").format("HH");
}

module.exports.randName = (length) =>
{
  length = length || 5
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < length; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

module.exports.Status = {};

module.exports.Status.internal2Res = (internal) => {
  switch(internal) {
    case 2101:
      return 1101;
    case 2102:
      return 1201;
    case 2201:
      return 1101;
    case 2202:
      return 1201;
    case 3000:
      return 1101;
    case 3001:
      return 1301;
    case 3002:
      return 1302;
    case 3003:
      return 1303;
    case 3004:
      return 1200;
    case 3100:
      return 200;
    case 3101:
      return 1104;
    case 3200:
      return 200;
    case 3201:
      return 1101;
    case 3300:
      return 200;
    case 3301:
      return 1101;
    case 3310:
      return 200;
    case 3311:
      return 1101;
    case 3312:
      return 1201;
    case 3313:
      return 1203;
    case 3314:
      return 1101;
  }
}


module.exports.Status.message = (internal) => {
  switch(internal) {
    case 2101:
      return 'Params illegal';
    case 2102:
      return 'API service internal error.';
    case 2201:
      return 'Params illegal';
    case 2202:
      return 'API service internal error.';
    case 3000:
      return 'Params illegal';
    case 3001:
      return 'Portal server error';
    case 3002:
      return 'Portal server error';
    case 3003:
      return 'Portal server error';
    case 3004:
      return 'Unexpected error';
    case 3100:
      return 'OK'
    case 3101:
      return 'Username or password invaild'
    case 3200:
      return 'OK';
    case 3201:
      return 'Params illegal';
    case 3300:
      return 'OK';
    case 3301:
      return 'Params illegal';
      case 3310:
        return 'OK';
      case 3311:
        return 'Params illegal';
      case 3312:
        return 'delete failed';
      case 3313:
        return 'insert failed';
      case 3314:
        return 'Book didn\'t exists in collection'
  }
}
