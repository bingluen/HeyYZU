var express = require('express');
var router = express.Router();

router.post('/', function(res, req, next) {
  res.redirect('https://hey.yzu.us');
});

module.exports = router;
