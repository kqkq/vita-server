var http = require('http');

function fixLocation(country, region, city) {
  if(region != '' && city != '') {
    if(region == city) return city;
    else return region + city;
  } else if(country != '' && (region != '' || city !='')) {
    return country + region + city;
  } else if(country != '') {
    return country;
  } else {
    return '\u706b\u661f'; // Chinese words: Mars (Huo Xing)
  }
}
/*
function initCounter(db, dev, callback) {
  var collection = db.collection('daily_counter');
  var datetime = new Date();
  var today = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate());
  collection.find({"date": {"$gte": today, "$lte": today}}, {"_id": 0}).count(function(err, count) {
    if(count == 0) {
      collection.insert({"date": today, "light": 0, "air": 0, "water": 0, "heater": 0, "total": 0}, function(err, result) {
        if(!err) console.log('A new day! Counter created.');
        var collection2 = db.collection('main_counter');
        collection2.find({}).count(function() {
          if(count == 0) {
            collection2.insert({"light": 0, "air": 0, "water": 0, "heater": 0, "total": 0}, function(err, result) {
              if(!err) console.log('Main counter initialized.');
              callback();
            });
          }
        });
      });
    } else {
      callback();
    }
  });
}
*/
function updateCounter(db, dev, callback) {
  var collection = db.collection('daily_counter');
  var datetime = new Date();
  var today = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate());
  //initCounter(db, dev, function() {
  var obj = {"$inc": {"total": 1}};
  obj.$inc[dev] = 1;
  collection.update({"date": {"$gte": today, "$lte": today}}, obj, function(err, result) {
    console.log('Daily Counter updated.');
    var collection2 = db.collection('main_counter');
    var obj2 = {"$inc": {"total": 1}};
    obj2.$inc[dev] = 1;
    collection2.update({}, obj2, function(err, result) {
      console.log('Main ounter updated.');
      if(callback) callback();
    });
  });
  //});
}

function logHistory(db, dev, req, action, callback) {
  //
  // Put following code into nginx's config file to make header['x-real-ip'] work
  //
  // proxy_set_header  X-Real-IP  $remote_addr;
  //
  var ip = req.headers['x-real-ip'];
  console.log('action: ' + action);
  //IP -> Location service provide by Taobao
  http.get('http://ip.taobao.com/service/getIpInfo.php?ip=' + ip, function(res) {
    res.setEncoding('utf8');
    if(res.statusCode != 200) {
      console.log('Query IP Location Failed. HTTP: ' + res.statusCode);
    } else {
      console.log('Waiting taobao');
    }
    res.once('data', function(json) {
      var ipLoc = JSON.parse(json);
      if(ipLoc.code != 0) {
        console.log('Query IP Location Failed. Got: ' + json);
      }
      
      //Make a document (object for mongoDB) to insert
      var dbDoc = {};
      dbDoc.ip     = ip;
      dbDoc.loc    = fixLocation(ipLoc.data.country, ipLoc.data.region, ipLoc.data.city);
      dbDoc.time   = new Date();
      dbDoc.device = dev;
      dbDoc.action = action;
      //console.log(JSON.stringify(dbDoc));
      
      //Insert the document into collection
      var collection = db.collection('history');
      collection.insert(dbDoc, function(err, result) {
        if(err) {
          console.log('Insert failed! Message: ' + err.message);
        } else {
          console.log('Document inserted: ' + JSON.stringify(result));
        }
        updateCounter(db, dev, function() {
          if(callback) callback(err, result);
        });
      });
    }); //ned of res.once(data)
    
    res.once('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}

exports.logHistory = logHistory;
