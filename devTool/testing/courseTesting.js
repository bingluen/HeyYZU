var course = require(__mobileAPIBase + 'module/course');

module.exports.courseHistory = function(user) {
  var userData = user || {
    id: 1,
    username: 's1010541',
    password: '093388'
  }
  course.updateCourseHistory(userData);
}
