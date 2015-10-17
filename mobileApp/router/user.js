var user = require('./mobileApp/modules/user');
var express = require('express');
var router = express.Router();

router.post('/login', user.login);
router.get('/porfile', user.porfile);
