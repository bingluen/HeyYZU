global.__SystemBase = __dirname + '/'

/* -------Module------- */

//SSL setting
var ssl = require('./sslLicense');

//For Http service
var https = require('https');
//For Mobile app backend
var mobileAPI = require('./mobileAPI');
//For Web Page
var webPage = require('./webPage');

/* -----Module-end----- */


/* port mapping */
var PortList = {
  mobileAPI: 4433,
  webService: 443
}

var hostName = "hey.yzu.us"

/**
 * Http service port & domain Setting
 */
mobileAPI.set('port', PortList.mobileAPI);
mobileAPI.set('domain', hostName);
webPage.set('port', PortList.webService);
webPage.set('domain', hostName);


/**
 * Create mobileAPI api Http service
 */
var mobileAPIServer = https.createServer(ssl.option, mobileAPI);

mobileAPIServer.listen(mobileAPI.get('port'), mobileAPI.get('domain'));

mobileAPIServer.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof PortList.mobileAPI === 'string'
    ? 'Pipe ' + PortList.mobileAPI
    : 'Port ' + PortList.mobileAPI;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

mobileAPIServer.on('listening', function() {
  var addr = mobileAPIServer.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('mobileAPI Api server have created on ' +  bind, 'status')
});

mobileAPIServer.on('connection', function(socket) {
  socket.setTimeout(0);
  // 30 second timeout. Change this as you see fit.
 })


 /**
  * Create Web Page Http service
  */
 var webPageServer = https.createServer(ssl.option, webPage);

 webPageServer.listen(webPage.get('port'), webPage.get('domain'));

 webPageServer.on('error', function(error) {
   if (error.syscall !== 'listen') {
     throw error;
   }

   var bind = typeof PortList.webService === 'string'
     ? 'Pipe ' + PortList.webService
     : 'Port ' + PortList.webService;

   // handle specific listen errors with friendly messages
   switch (error.code) {
     case 'EACCES':
       console.error(bind + ' requires elevated privileges');
       process.exit(1);
       break;
     case 'EADDRINUSE':
       console.error(bind + ' is already in use');
       process.exit(1);
       break;
     default:
       throw error;
   }
 });

 webPageServer.on('listening', function() {
   var addr = webPageServer.address();
   var bind = typeof addr === 'string'
     ? 'pipe ' + addr
     : 'port ' + addr.port;
   console.log('mobileAPI Api server have created on ' +  bind, 'status')
 });

 webPageServer.on('connection', function(socket) {
   socket.setTimeout(0);
   // 30 second timeout. Change this as you see fit.
  })

/*
  Auto redirect to https
 */
// set up plain http server
var http = express.createServer();

// set up a route to redirect http to https
http.get('*',function(req,res){
    res.redirect('https://' + hostName + req.url)
})

// have it listen on 8080
http.listen(80);
