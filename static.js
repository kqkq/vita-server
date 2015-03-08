var fs = require('fs');
var url = require('url');
var path = require('path');
var mime = require('./mime').types;

function staticFileServer(req, res){
  var pathname = url.parse(req.url).pathname;
  if(pathname == '/') pathname = '/index.html'; //Default homepage
  var realPath = 'assets' + pathname;
  fs.exists(realPath, function(exists) {
    if(!exists) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end(pathname + ' was not found.');
    } else {
      var ext = path.extname(realPath);
      ext = ext ? ext.slice(1) : 'txt';
      var contentType = mime[ext] || 'text/plain';
      var file = fs.createReadStream(realPath);
      file.on('open', function() {
        res.setHeader('Content-Type', contentType);
        res.statusCode = 200;
        file.pipe(res);
      });
      file.on('error', function(err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(JSON.stringify(err));
        console.log(err);
      });
    }
  });
}

exports.staticFileServer = staticFileServer;
