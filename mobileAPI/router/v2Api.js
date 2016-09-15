var express = require('express');
var router = express.Router();

/* Controller */
var loginController = require( __mobileAPIBase + 'controller/v2/loginController');
var courseController = require(__mobileAPIBase + 'controller/v2/courseController');
var userController = require( __mobileAPIBase + 'controller/v2/userController');
var libraryController = require( __mobileAPIBase + 'controller/v2/libraryController');
var calendarController = require( __mobileAPIBase + 'controller/v2/calendarController');

/*
  Login Router
 */
router.post('/login/student', loginController.student);
router.post('/verifyToken/', loginController.verifyToken);

/*
  Course Router
 */
router.post('/course/info', courseController.getCourseDetail);
router.post('/course/homework', courseController.getCourseHomework);
router.get('/course/attachments/:id', courseController.getAttachment);
router.post('/course/notice', courseController.getCourseNotice);
router.post('/course/material', courseController.getCourseMaterial);
router.post('/course/grade/:type', courseController.getGrade);

/*
  User Router
 */
router.post('/user/student/profile', userController.studentProfile);
router.post('/user/student/course', userController.studentCourse);
router.post('/user/student/refreshCourse', userController.refreshStudentCourse);

/*
  Library Router
 */
router.post('/library/search', libraryController.search);
router.post('/library/bookInfo', libraryController.bookInfo);
router.post('/library/loanRecord', libraryController.loanRecord);
router.get('/library/collection', libraryController.getCollection);
router.delete('/library/collection', libraryController.removeFromCollection);
router.post('/library/collection', libraryController.add2Collection);

/*
  Calendar
 */
router.post('/calendar/list', calendarController.calendar);

module.exports = router;
