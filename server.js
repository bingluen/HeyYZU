global.__SystemBase = __dirname + '/'

/* -------Module------- */

//For Http service
var http = require('http');
//For Mobile app backend
var mobileApp = require('./mobileApp');

//logging
var Logging = require('./modules/logging')('system');

/* -----Module-end----- */


/* port mapping */
var PortList = {
  mobileApp: 4433,
  webService: 443
}

/**
 * Http service port Setting
 */
mobileApp.set('port', PortList.mobileApp);

/**
 * Create mobileApp api Http service
 */
var MobileAppServer = http.createServer(mobileApp);

MobileAppServer.listen(PortList.mobileApp);

MobileAppServer.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      Logging.writeMessage(bind + ' requires elevated privileges', 'error')
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      Logging.writeMessage(bind + ' is already in use', 'error')
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

MobileAppServer.on('listening', function() {
  var addr = MobileAppServer.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
  Logging.writeMessage('MobileApp Api server have created on ' +  bind, 'status')
});

MobileAppServer.on('connection', function(socket) {
  socket.setTimeout(0);
  // 30 second timeout. Change this as you see fit.
 })
