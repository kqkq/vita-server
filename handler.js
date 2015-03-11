var logHistory = require('./history').logHistory;

var inst = new Array();
var MAX_TRIGGER = 10, PERIOD = 600; //You can water Vita `MAX_TRIGGER` times in `PERIOD` seconds.

inst['air']    = {"name": "Fan",    "on": "!A", "off": "!a", "query": "?A"};
inst['water']  = {"name": "Pump",   "on": "!W", "off": "!w", "query": "?W"};
inst['heater'] = {"name": "Heater", "on": "!H", "off": "!h", "query": "?H"};

function deviceReady(sock, pot, res) {
  if(!sock) {
    pot.ready = false;
    res.writeHead(503, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(pot));
    return false;
  } else {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return true;
  }
}

function checkWater(db, callback) {
  var collection = db.collection('history');
  var tm = new Date(new Date() - PERIOD * 1000);
  collection.find({"time": {"$gte": tm}, "device": "water"}, {"_id": 0}).sort({"time": 1}).toArray(function(err, docs) {
    console.log(docs.length + ' docs up-to-date: ' + JSON.stringify(docs));
    var remainTime;
    if(docs.length < MAX_TRIGGER) {
      remainTime = 0;
    } else {
      var firstTime = docs[0].time;
      var currTime  = new Date();
      remainTime    = Math.round(PERIOD - (currTime - firstTime) / 1000);
      console.log('Remain: ' + remainTime);
    }
    callback(remainTime, PERIOD);
  });
}

function pwmHandler(dev, db, req, res, pot, sock, query) {
  if(!deviceReady(sock, pot, res)) return;
  var brightness = 0;
  if(query.dim) {
    console.log(JSON.stringify(query));
    if(isNaN(query.dim)) {
      res.end(JSON.stringify(pot), function(){
        console.log('Unrecognized arguments: ' + query.dim);
      });
    } else {
      brightness = parseInt(query.dim, 10);
      sock.write('~L' + brightness, function(){
        console.log('Alternate brightness to ' + brightness);
      });
    }
    sock.once('data', function(data){
      if(data == 'R') {
        pot.light = brightness;
        console.log('Alternated brightness = ' + brightness);
        logHistory(db, dev, req, brightness);
      }
      res.end(JSON.stringify(pot));
    });
  } else {
    sock.write('?L', function(){
      console.log('Querying the brightness of Lights');
    });
    sock.once('data', function(data) {
      //console.log(JSON.stringify(data));
      brightness = parseInt(data, 10);
      if(!isNaN(brightness)) {
        pot.light = brightness;
        console.log('Light brightness = ' + brightness);
      }
      res.end(JSON.stringify(pot));
    });
  }
}

function onOffHandler(dev, db, req, res, pot, sock, query){
  if(!deviceReady(sock, pot, res)) return;
  if(query.action){  //Operate
    console.log(JSON.stringify(query));
    if(query.action == 'on') {
      sock.write(inst[dev].on, function(){
        console.log('Switching the ' + inst[dev].name + ' ON');
      });
    } else if(query.action == 'off') {
      sock.write(inst[dev].off, function(){
        console.log('Switching the ' + inst[dev].name + ' OFF');
      });
    } else {
      res.end(JSON.stringify(pot), function(){
        console.log('Unrecognized arguments: ' + query.action);
      });
    }
    sock.once('data', function(data) {  //Waiting for acknowledgement
      if(data == 'R') {
        eval('pot.' + dev + ' = (query.action == \'on\');');
        console.log('The ' + inst[dev].name + ' is switched ' + query.action);
        logHistory(db, dev, req, query.action);
      }
      res.end(JSON.stringify(pot));
    });
  } else {           //Accquire
    sock.write(inst[dev].query, function(){
      console.log('Querying the state of ' + inst[dev].name);
    });
    sock.once('data', function(data) {  //Waiting for acknowledgement
      if(data == '1') eval('pot.' + dev + ' = true');
      else eval('pot.' + dev + ' = false');
      console.log('The lights are ' + (data == 1 ? 'ON' : 'OFF'));
      res.end(JSON.stringify(pot));
    });
  }
}

function triggerHandler(dev, db, req, res, pot, sock, query){
  if(!deviceReady(sock, pot, res)) return;
  if(query.action){  //Operate
    console.log(JSON.stringify(query));
    if(query.action == 'on') {
      checkWater(db, function(remaining, total) {
        if(remaining == 0) {
          pot.water = true;
          pot.remaining = 0;
          pot.total = total;
          
          sock.write(inst[dev].on, function(){
            console.log('Switching the ' + inst[dev].name + ' ON');
          });

          sock.once('data', function(data) {  //Waiting for acknowledgement
            if(data == 'R') {
              eval('pot.' + dev + ' = (query.action == \'on\');');
              console.log('The ' + inst[dev].name + ' is switched ' + query.action);
              logHistory(db, dev, req, query.action);
            }
            res.end(JSON.stringify(pot));
          }); //end of sock.once callback
        } else {
          pot.water = false;
          pot.remaining = remaining;
          pot.total = total;
          res.end(JSON.stringify(pot));
        }
      }); //end of checkWater callback
    } else {
      res.end(JSON.stringify(pot), function(){
        console.log('Unrecognized arguments: ' + query.action);
      });
    }
  } else {           //Accquire
    checkWater(db, function(remaining, total) {
      if(remaining == 0) {
        pot.water = true;
        pot.remaining = 0;
        pot.total = total;
      } else {
        pot.water = false;
        pot.remaining = remaining;
        pot.total = total;
      }
      res.end(JSON.stringify(pot));
    });
  }
}

function historyHandler(db, req, res, query) {
  var limit = !isNaN(query.limit) ? parseInt(query.limit, 10) : 20;
  if(limit > 200) limit = 200;
  var collection = db.collection('history');
  collection.find({}, {"_id": 0}).sort({"time": -1}).limit(limit).toArray(function(err, docs) {
    if(!err) {
      res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
      res.end(JSON.stringify(docs));
    } else {
      console.log('Querying failed! Message: ' + err.message);
      res.writeHead(500, {'Content-Type': 'application/json;charset=utf-8'});
      res.end();
    }
  });
}

exports.pwmHandler     = pwmHandler;
exports.onOffHandler   = onOffHandler;
exports.triggerHandler = triggerHandler;
exports.historyHandler = historyHandler;
