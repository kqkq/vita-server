var net = require('net');
var http = require('http');
var url = require('url');

var lightHandler = require('./handler').lightHandler;
var onOffHandler = require('./handler').onOffHandler;
var staticFileServer  = require('./static').staticFileServer;

var HTTP_PORT = 8080;
var TCP_PORT  = 9058;
var tcpSock;
var pot = {"ready": false, "light": 0, "air": false, "water": false, "heater": false};

var tcpServer = net.createServer(function(c) { //'connection' listener
  console.log('client connected');
  tcpSock = c;
  pot.ready = true;
  
  c.on('end', function() {
    console.log('client disconnected');
    tcpSock = undefined;
    pot.ready = false;
  });

  c.on('error', function(e){
    console.log('Error: ' + e.code + ', TCP connection terminated.');
    tcpSock = undefined;
    pot.ready = false;
  });

  c.write('SPOT');
});

var httpServer = http.createServer(function(req, res){
  //console.log('Request: ' + req.url);
  var parsed = url.parse(req.url, true);
  var path = parsed.path;
  if     (path.lastIndexOf('/light',  0) === 0) lightHandler(req, res, pot, tcpSock, parsed.query);
  else if(path.lastIndexOf('/air',    0) === 0) onOffHandler('air',    req, res, pot, tcpSock, parsed.query);
  else if(path.lastIndexOf('/water',  0) === 0) onOffHandler('water',  req, res, pot, tcpSock, parsed.query);
  else if(path.lastIndexOf('/heater', 0) === 0) onOffHandler('heater', req, res, pot, tcpSock, parsed.query);
  else                                          staticFileServer(req, res);
  console.log('Parse: ' + path);
});

tcpServer.listen(TCP_PORT, function() { //'listening' listener
  console.log('TCP server listening on port ' + TCP_PORT);
  pot.ready = false;
});

httpServer.listen(HTTP_PORT, function(){
  console.log('HTTP server listening on port ' + HTTP_PORT);
});

