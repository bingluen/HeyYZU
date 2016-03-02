var express = require('express');
var router = express.Router();

/* Controller */
var loginController = require( __mobileAPIBase + 'controller/v2/loginController');
var courseController = require(__mobileAPIBase + 'controller/v2/courseController');

/*
  Login Router
 */
router.post('/login/student', loginController.student);
router.post('/verifyToken/', loginController.verifyToken);

/*
  Course Router
 */
router.post('/course', courseController);

module.exports = router;
