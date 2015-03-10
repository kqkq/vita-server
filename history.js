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

function logHistory(dev, req, action) {
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
      console.log('Query IP Location Failed.');
    } else {
      console.log('Waiting taobao');
    }
    res.on('data', function(json) {
      var ipLoc = JSON.parse(json);
      if(ipLoc.code != 0) {
        console.log('Query IP Location Failed.');
      }
      //Make a document (object for mongoDB) to insert
      var dbDoc = {};
      dbDoc.ip     = ipLoc.data.ip;
      dbDoc.loc    = fixLocation(ipLoc.data.country, ipLoc.data.region, ipLoc.data.city);
      dbDoc.time   = new Date();
      dbDoc.device = dev;
      dbDoc.action = action;
      console.log(JSON.stringify(dbDoc));
    });
    
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}

exports.logHistory = logHistory;
