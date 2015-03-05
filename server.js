var net = require('net');
//var crossroads = require('crossroads');
var http = require('http');
var url = require('url');

var lightHandler = require('./handler').lightHandler;

var HTTP_PORT = 8080;
var TCP_PORT  = 9058;
var tcpSock;
var pot = {};

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
});

var httpServer = http.createServer(function(req, res){
  //console.log('Request: ' + req.url);
  if(tcpSock) {
    var parsed = url.parse(req.url, true);
    var path = parsed.path;
    if(path.lastIndexOf('/light', 0) === 0) lightHandler(req, res, pot, tcpSock, parsed.query);
    console.log('Parse: ' + path);

  } else {
    res.writeHead(503, {'content-type': 'text/html'});
    res.end(JSON.stringify(pot));
  }
});

tcpServer.listen(TCP_PORT, function() { //'listening' listener
  console.log('TCP server listening on port ' + TCP_PORT);
  pot.ready = false;
});

httpServer.listen(HTTP_PORT, function(){
  console.log('HTTP server listening on port ' + HTTP_PORT);
});

