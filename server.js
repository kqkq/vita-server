var net = require('net');
var http = require('http');
var url = require('url');
var mongoClient = require('mongodb');

var pwmHandler = require('./handler').pwmHandler;
var onOffHandler = require('./handler').onOffHandler;
var triggerHandler = require('./handler').triggerHandler;
var historyHandler = require('./handler').historyHandler;
var counterHandler = require('./handler').counterHandler;
var staticFileServer  = require('./static').staticFileServer;

var HTTP_PORT = 8080;
var TCP_PORT  = 9058;
var pot = {"ready": false, "light": 0, "air": false, "water": true, "remaining": 0, "total": 0, "heater": false};
var tcpSock;

var tcpServer = net.createServer(function(sock) { //'connection' listener
  console.log('client connected');
  pot.ready = true;
  tcpSock = sock;

  var timerID = setInterval(function() {
    if(tcpSock) sock.write('K');
    //console.log('KeepAlive');
  }, 5000);

  sock.once('end', function() {
    console.log('client disconnected');
    tcpSock = undefined;
    pot.ready = false;
    clearInterval(timerID);
  });

  sock.once('error', function(e){
    console.log('Error: ' + e.code + ', TCP connection terminated.');
    tcpSock = undefined;
    pot.ready = false;
    clearInterval(timerID);
    sock.destroy();
  });

  sock.write('SPOT');
  
}); //end create TCP server

tcpServer.listen(TCP_PORT, function() { //'listening' listener
  console.log('TCP server listening on port ' + TCP_PORT);
  pot.ready = false;
  mongoClient.connect('mongodb://localhost:27017/vita', function(err, db) {
    if(!err) {
      console.log('Connected to MongoDB');
    }

    var httpServer = http.createServer(function(req, res) {
      //console.log('Request: ' + req.url);
      var parsed = url.parse(req.url, true);
      var path = parsed.path;
      if     (path.lastIndexOf('/light',  0) === 0)  pwmHandler    ('light',  db, req, res, pot, tcpSock, webSocket, parsed.query);
      else if(path.lastIndexOf('/air',    0) === 0)  onOffHandler  ('air',    db, req, res, pot, tcpSock, webSocket, parsed.query);
      else if(path.lastIndexOf('/water',  0) === 0)  triggerHandler('water',  db, req, res, pot, tcpSock, webSocket, parsed.query);
      else if(path.lastIndexOf('/heater', 0) === 0)  onOffHandler  ('heater', db, req, res, pot, tcpSock, webSocket, parsed.query);
      else if(path.lastIndexOf('/history', 0) === 0) historyHandler(          db, req, res,               parsed.query);
      else if(path.lastIndexOf('/counter', 0) === 0) counterHandler(          db, req, res,               parsed.pathname);
      else                                          staticFileServer(req, res);
      console.log('Parse: ' + path);
    });

    var webSocket = require('socket.io')(httpServer);
    webSocket.on('connection', function(socket) {
      console.log('A WebSocket client is connected');
      socket.on('disconnect', function () {
        console.log('A WebSocket is DISCONNECTED.');
      });
    });
    
    httpServer.listen(HTTP_PORT, function(){
      console.log('HTTP server listening on port ' + HTTP_PORT);
    }); //end create HTTP listener
  }); //end mongoDB connect
}); //end TCP listener
