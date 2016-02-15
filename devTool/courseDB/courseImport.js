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

function processMutipleTeacher() {
	var checkList = [];
	var queryStatement = "select deptCode, courseTeacher as teacherName from (select deptCode, courseTeacher, count(deptCode) AS DN from course_temporary_table where length(courseTeacher) > 12 and courseTeacher REGEXP '[^a-zA-Z]' group by courseTeacher, deptCode) as ST group by courseTeacher having max(DN);"
	var check = function() {
		var queryStatement = "Create temporary table checkList (name varchar(20));"
		checkList.forEach(function() {
			queryStatement += "INSERT INTO checkList SET ?;"
		})
		queryStatement += "INSERT INTO teacher (teacherName) SELECT name as teacherName FROM checkList WHERE not exists (SELECT * FROM teacher WHERE teacherName = name);"
		var listData = checkList.map(cv => ({ name: cv }));
		var query = dbHelper.query(queryStatement, listData, function(err, result, field) {
			if (err) { console.error(err) } else {
				console.log(result[result.length - 1]);
			}
		})
	}

	var query = dbHelper.query(queryStatement, null, function(err, result, field) {
		if (err) { console.error(err) } else {
			var nameList = result.map((cv) => cv['teacherName'].split('、'));

			nameList.forEach(function(cv) {
				cv.forEach(function(cv) {
					if(cv.length > 0 && checkList.indexOf(cv) < 0) {
						checkList.push(cv);
					}
				})
			})

			check();
		}
	})
}

function setDepartment() {
	var queryStatement = "select teacherName from teacher where deptCode is NULL;"
	var setDeptCode = function(teacherList) {
		var queryStatement = ""
		teacherList.forEach(function(cv, i, arr) {
			queryStatement += "UPDATE teacher JOIN (SELECT * FROM (select '"+cv.teacherName+"' as TN, deptCode, count(deptCode) as count From course_temporary_table where courseTeacher LIKE '%"+ cv.teacherName +"%' GROUP by deptCode) AS T Having max(count)) AS T ON teacher.teacherName = T.TN SET teacher.deptCode = T.deptCode;";
		})
		var query = dbHelper.query(queryStatement, null, function(err, result, field) {
			if (err) { console.error(err) } else { console.log(result) }
		})
	}
	var query = dbHelper.query(queryStatement, null, function(err, result, field) {
		if (err) { console.error(err) } else { setDeptCode(result); }
	})
}

function setTeacher() {
	var queryStatement = "select lesson_id, lessonTeacher from lesson where lessonTeacher LIKE '%、%';";
	var query = dbHelper.query(queryStatement, null, function(err, result, field){
		if(err) { console.error(err) } else {
			var list = result.reduce(function(pv, cv) {
				var currentList = [];
				cv.lessonTeacher.split('、').forEach(function(lcv) {
					currentList.push({
						lesson_id: cv.lesson_id,
						lessonTeacher: lcv
					});
				})
				return pv.concat(currentList);
			}, []);
			console.log(list);
			setTeacher(list);
		}
	})

	function setTeacher(list) {
		var queryStatement = 'Create temporary table teacherList (lesson_id int(10) unsigned, lessonTeacher varchar(100));'
		list.forEach(function() {
			queryStatement += "INSERT INTO teacherList SET ?;"
		});
		queryStatement += "INSERT INTO teach (lesson_id, teacher_id) SELECT teacherList.lesson_id, teacher.teacher_id FROM teacherList join teacher on teacherList.lessonTeacher = teacher.teacherName;"
		var query = dbHelper.query(queryStatement, list, function(err, result, field){
			if(err) { console.error(err) } else {
				console.log(result);
			}
		})
	}
}

setTeacher();
