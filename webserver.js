var portastic = require('portastic');
var express = require('express');
var app = express();
var socketio = require('socket.io');
var bonjour = require('bonjour')();

// WEBSERVER
function WebServer()
{
    var that = this;
    this.io = null;
    this.peers = {};

    this.start = function(port, basepath)
    {
        this.port = port;
        this.basepath = basepath;

        // Search for Peers
        bonjour.find({ type: 'KPi-peer' }, function (service) {
            // Add it to known peers list
            that.peers[service.name] = 'http://'+service.host+':'+service.port;
            // Inform clients
            if (that.ready()) that.io.emit('peers', Object.keys(that.peers));
        });

        // Start web server
        portastic.test(this.port)
        .then(function(isOpen){
            if (isOpen) that.serve();
            else console.log ('WEBSERVER: failed to start, port '+that.port+' is already in use..');
        });
    }

    this.serve = function() {
      // Serve Remote control APP files
      app.use(express.static(that.basepath));
      app.get('/', function (req, res) {
          res.sendfile(that.basepath + 'index.html');
      });

      // Handle Remote control commands
      this.io = socketio(app.listen(that.port));
      this.io.on('connection', function (client)
      {
          client.emit('peers', Object.keys(that.peers));
          client.on('disconnect', function () {
              //console.log('WEBSERVER: interface disconnected');
          });
      });
      console.log ('WEBSERVER: started on port '+that.port);
    }

    this.ready = function() {
      return (this.io !== null);
    }
}

var exports = module.exports = function() { return new WebServer() };
