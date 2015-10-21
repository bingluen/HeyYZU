var user = require( __MobileAppBase + 'mobileApp/modules/user');
var express = require('express');
var router = express.Router();

router.post('/login', user.login);
router.post('/profile', user.profile);

module.exports = router;
