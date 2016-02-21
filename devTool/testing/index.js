var path = require('path');

/* Setting Path  */
global.__mobileAPIBase = path.join(__dirname, '../../', 'mobileAPI/');
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');
global.__SystemBase = path.join(__dirname, '../../');

/* Test module */
var rsaTesting = require('./rsaTesting');
var courseTesting = require('./courseTesting');


console.log("Rsa Testing ...", rsaTesting(''));
console.log("course Testing ...", courseTesting.courseHistory());
