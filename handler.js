var inst = new Array();
inst['air']    = {"name": "Fan",    "on": "!A", "off": "!a", "query": "?A"};
inst['water']  = {"name": "Pump",   "on": "!W", "off": "!w", "query": "?W"};
inst['heater'] = {"name": "Heater", "on": "!H", "off": "!h", "query": "?H"};

function lightHandler(req, res, pot, sock, query){
  if(query.action){
    console.log(JSON.stringify(query));
    if(query.action == 'on') {
      sock.write('!L', function(){
        console.log('Switching the Light ON');
      });
    } else if(query.action == 'off') {
      sock.write('!l', function(){
        console.log('Switching the Light OFF');
      });
    } else {
      res.end(JSON.stringify(pot), function(){
        console.log('Unrecognized arguments');
      });
    }
    sock.on('data', function(data){
      if(data == 'R') {
        pot.light = (query.action == 'on');
        console.log('The lights are switched ' + query.action);
      }
      res.end(JSON.stringify(pot));
    });
  } else {
    sock.write('?L', function(){
      console.log('Querying the state of Lights');
    });
    sock.on('data', function(data){
      if(data == '1') pot.light = true;
      else pot.light = false;
      console.log('The lights are ' + (data == 1 ? 'ON' : 'OFF'));
      res.end(JSON.stringify(pot));
    });
  }
}

function onOffHandler(dev, req, res, pot, sock, query){
    if(query.action){
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
                    console.log('Unrecognized arguments');
                    });
        }
        sock.on('data', function(data){
                if(data == 'R') {
                eval('pot.' + dev + ' = (query.action == \'on\');');
                console.log('The ' + inst[dev].name + ' is switched ' + query.action);
                }
                res.end(JSON.stringify(pot));
                });
    } else {
        sock.write(inst[dev].query, function(){
                   console.log('Querying the state of ' + inst[dev].name);
                   });
        sock.on('data', function(data){
                if(data == '1') eval('pot.' + dev + ' = true');
                else eval('pot.' + dev + ' = false');
                console.log('The lights are ' + (data == 1 ? 'ON' : 'OFF'));
                res.end(JSON.stringify(pot));
                });
    }
}

exports.lightHandler = lightHandler;
exports.onOffHandler   = onOffHandler;
