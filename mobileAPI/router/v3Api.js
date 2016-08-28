var express = require('express');
var router = express.Router();

var loginController = require(__mobileAPIBase + 'controller/v3/loginController');
var tokenController = require(__mobileAPIBase + 'controller/v3/tokenController');
var courseController = require(__mobileAPIBase + 'controller/v3/courseController');
var libraryController = require(__mobileAPIBase + 'controller/v3/libraryController');
var userController = require(__mobileAPIBase + 'controller/v3/userController');
var calendarController = require(__mobileAPIBase + 'controller/v3/calendarController');

/**
 * Login router
 */

router.post('/login', loginController.student);

/**
 * Token router
 */
router.post('/token/verify', tokenController.verify);
router.get('/token/refresh', tokenController.refresh);

/**
 * Course Router
 */
router.get('/course/info/:courseId', courseController.getCourseInfo);
router.get('/course/homeworks/:courseId', courseController.getHomeworks);
router.get('/course/notices/:courseId', courseController.getNotices);
router.get('/course/materials/:courseId', courseController.getMaterials);
router.get('/course/attachments/:id', courseController.getAttachment);

/**
 * Library Router
 */
router.get('/library/search', libraryController.doSearch);
router.get('/library/bookinfo', libraryController.getBookInfo);
router.get('/library/loanRecord/:type', libraryController.getLoanRecord);
router.get('/library/collection', libraryController.getCollection);
router.post('/library/collection', libraryController.add2Collection);
router.delete('/library/collection', libraryController.removeFromCollection);

/**
 * User Router
 */
router.get('/user/course', userController.getCourses);
router.post('/user/refreshCourse', userController.refreshCourse);
router.post('/user/device', userController.refreshDeviceToken);
router.get('/user/device', userController.getDevices);

/**
 * Calendar
 */
router.post('/calendar/list', calendarController.list);
router.get('/calendar/tags', calendarController.getTags);


module.exports = router;
