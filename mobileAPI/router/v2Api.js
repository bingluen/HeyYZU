var express = require('express');
var router = express.Router();

/* Controller */
var loginController = require( __mobileAPIBase + 'controller/loginController');

/*
  Login Router
 */
router.post('/login/student', loginController.student);

module.exports = router;
