var express = require('express');
var router = express.Router();

const systemController = require(__mobileAPIBase + 'controller/v3/systemController');
const loginController = require(__mobileAPIBase + 'controller/v3/loginController');
const tokenController = require(__mobileAPIBase + 'controller/v3/tokenController');
const courseController = require(__mobileAPIBase + 'controller/v3/courseController');
const libraryController = require(__mobileAPIBase + 'controller/v3/libraryController');
const userController = require(__mobileAPIBase + 'controller/v3/userController');
const calendarController = require(__mobileAPIBase + 'controller/v3/calendarController');
const eventController = require(__mobileAPIBase + 'controller/v3/eventController');

/**
 * System status
 */
router.get('/status', systemController.status);
router.get('/status/iOS', systemController.iOS);
router.get('/status/android', systemController.android);

/**
 * Login router
 */

router.post('/login', loginController.student);
router.delete('/logout', loginController.logout);
router.delete('/logoutAll', loginController.logoutAll);

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
router.get('/library/status/:mediaType/:bibliosno', libraryController.getBookStatus);
router.get('/library/book/:bibliosno', libraryController.getBookInfo);
router.get('/library/loanRecord/:type', libraryController.getLoanRecord);
router.get('/library/collection', libraryController.getCollection);
router.post('/library/collection', libraryController.add2Collection);
router.delete('/library/collection', libraryController.removeFromCollection);
router.get('/library/dashboard', libraryController.getDashboard);
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

/**
 * Event
 */
router.get('/event/list', eventController.list);


module.exports = router;
