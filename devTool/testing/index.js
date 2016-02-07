var path = require('path');

/* Setting Path  */
global.__mobileAPIBase = path.join(__dirname, '../../', 'mobileAPI/')
global.__mobileAPIConfig = require(__mobileAPIBase + 'config.json');

/* Test module */
var rsaTesting = require('./rsaTesting');


console.log("Rsa Testing ...", rsaTesting(''));
