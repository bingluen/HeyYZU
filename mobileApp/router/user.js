var user = require( __MobileAppBase + 'modules/user');
var express = require('express');
var router = express.Router();

router.post('/login', user.login);
router.post('/profile', user.profile);
router.post('/course', user.courses);
router.post('/homework', user.homework);
router.get('/attach/:token/:type/:attachID/:attachName', user.attach);
router.post('/notice', user.notice);

module.exports = router;
