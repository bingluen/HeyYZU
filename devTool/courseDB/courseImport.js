var mysql = require('mysql');
var fs = require('fs-extra');
var dbConfig = require('../../mobileAPI/config.json').database;

var dbHelper = mysql.createConnection({
	host: dbConfig.host,
	user: dbConfig.username,
	password: dbConfig.password,
	database: dbConfig.dbname,
	multipleStatements: true,
	timezone: '0000'
});


var jsonFileList = [
  /*'database100-1.json',
  'database100-2.json',
  'database100-3.json',
  'database101-1.json',
  'database101-2.json',
  'database101-3.json',
  'database102-1.json',
  'database102-2.json',
  'database102-3.json',
  'database103-1.json',
  'database103-2.json',
  'database103-3.json',
  'database104-1.json',
  'database104-2.json',
  'database104-3.json',*/
];


function createDatabase(next) {
  next = next || () => null;
  var queryStatement = ""
    + "CREATE TABLE IF NOT EXISTS course_temporary_table ("
    + " unique_id int(20) unsigned auto_increment,"
    + " deptCode int(3) unsigned,"
    + " deptRawName varchar(50),"
    + " deptName varchar(50),"
    + " deptType varchar(20),"
    + " courseCode varchar(20),"
    + " courseName varchar(50),"
    + " courseType varchar(10),"
    + " courseCredit int(1) unsigned,"
    + " courseDegree int(1) unsigned,"
    + " courseYear int(3) unsigned,"
    + " courseSemester int(1) unsigned,"
    + " courseClass varchar(2),"
    + " courseTeacher varchar(100),"
    + " courseTime varchar(100),"
    + " courseClassroom varchar(300),"
    + " courseUrl text,"
    + " primary key(unique_id)"
    + ");"
  var query = dbHelper.query(queryStatement, null, function(err, result, field) {
    if (err) { console.log(err); }
    else { next(); }
  })
}

function importData(next) {
  next = next || () => null;
  jsonFileList.forEach(function(cv, index, arr) {
    var file = fs.readJsonSync(cv);
    var buffer = [];
    var queryStatement = ""
    file.course.forEach(function(cv) {
      buffer.push({
        deptCode: cv.deptCode,
        deptRawName: cv.deptRawName,
        deptName: cv.deptName,
        deptType: cv.deptType,
        courseCode: cv.code,
        courseName: cv.chinese_name,
        courseType: cv.type,
        courseCredit: cv.credit,
        courseDegree: cv.degree,
        courseYear: cv.year,
        courseSemester: cv.semester,
        courseClass: cv.class,
        courseTeacher: cv.teacher,
        courseTime: Object.keys(cv.classroom).reduce((pv, cv, ci) => (pv ? (pv + ', ' + cv) : cv), ''),
        courseClassroom: JSON.stringify(cv.classroom),
        courseUrl: cv.url
      });
      queryStatement += "INSERT INTO course_temporary_table SET ?;"
    });
    var query = dbHelper.query(queryStatement, buffer, function(err, result, field){
      if (err) { console.log(err); }
      else { console.log('資料已導入暫存資料庫，準備進行處理'); next(); }
    })
  });
}

function 

createDatabase(importData());
