var pyCarriers = require(__mobileAPIBase + 'module/pyCarriers');
var dbHelper = require( __mobileAPIBase + 'module/dbHelper');

module.exports.updateCourseHistory = function(user, next) {
  /* Step 1 get course history */
  pyCarriers({
    args: ['courseHistory', user.username, user.password],
    scriptFile: 'catalyst.py'
  }, function(r) {
    if(r.statusCode != 200) {
      res.status(200).json({
        statusCode: r.statusCode,
        status: r.status
      });
      return;
    } else {
      update(r.data);
    }
  });

  /* Step 2 compare data and update */
  function update(data) {
    var queryStatement = ""
      + "Create temporary table userCourse ("
      + " code varchar(6),"
      + " year int(3) unsigned,"
      + " semester int(1) unsigned,"
      + " class varchar(4)"
      + ");"

    data.forEach(function(){
      queryStatement += "INSERT INTO userCourse SET ?;"
    });

    queryStatement += "SELECT ?, lesson_id FROM userCourse join lesson on courseCode = code and lessonYear = year and lessonSemester = semeter and lessonClass = class;";

    var query = dbHelper.query(queryStatement, data.concat([user.id]), function(err, result, field) {
      if (err) { console.error(err) } else {
        result.forEach( function(cv) { console.log(cv) });
      }
    });
  }
}
