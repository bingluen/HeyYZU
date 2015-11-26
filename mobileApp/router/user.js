var user = require( __MobileAppBase + 'modules/user');
var express = require('express');
var router = express.Router();

router.post('/login', user.login);
router.post('/profile', user.profile);
router.post('/course', user.courses);

module.exports = router;
