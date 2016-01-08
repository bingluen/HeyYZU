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
