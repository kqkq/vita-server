var http = require('http');
var server = 'api.jinhao.me';

setInterval(function() {
  var req = http.get('http://' + server + '/light', function(res) {
    res.on('data', function(chunk) {
      var pot = JSON.parse(chunk);
      if(pot.light <= 64) {
        var opr_req = http.get('http://' + server + '/light?dim=128', function(res2) {
          res2.on('data', function(chunk2) {
            var new_pot = JSON.parse(chunk2);
            console.log('[' + new Date() + ']  ' + 'Change the light from ' + pot.light + ' to ' + new_pot.light);
          });
        });
      }
      else {
         console.log('[' + new Date() + ']  ' + 'Light brightness = ' + pot.light + '. It\'s OK.');
      }

      if(pot.air == true) {
        var opr_req = http.get('http://' + server + '/air?action=off', function(res2) {
          res2.on('data', function(chunk2) {
            var new_pot = JSON.parse(chunk2);
            console.log('[' + new Date() + ']  ' + 'Change the fan from ' + pot.air + ' to ' + new_pot.air);
          });
        });
      }
      else {
         console.log('[' + new Date() + ']  ' + 'The fan is OK.');
      }

    });
  });
}, 300000);
