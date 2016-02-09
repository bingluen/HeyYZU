var express = require('express');
var router = express.Router();

/* Controller */
var loginController = require( __mobileAPIBase + 'controller/v2/loginController');

/*
  Login Router
 */
router.post('/login/student', loginController.student);
router.get('/verifyToken/:token', loginController.verifyToken);

module.exports = router;
