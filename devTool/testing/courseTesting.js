var course = require(__mobileAPIBase + 'module/course');

module.exports.courseHistory = function(user) {
  var userData = user || {
    id: 1,
    username: 's1010541',
    password: '093388'
  }
  course.updateCourseHistory(userData, function(err, result) {
    if (err) { console.error(err); return false; } else {
      console.log(result);
    }
  });
}
