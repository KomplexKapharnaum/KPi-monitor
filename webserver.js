var portastic = require('portastic');
var express = require('express');
var app = express();
var socketio = require('socket.io');

// WEBSERVER
function WebServer() 
{
    var that = this;
    this.io = null;

    this.start = function(port, basepath) 
    {
        this.port = port;
        this.basepath = basepath;

        portastic.test(this.port)
        .then(function(isOpen){
            if (isOpen) that.websocket();
            else console.log ('WEBSERVER: failed to start, port '+that.port+' is already in use..');
        });
    }

    this.websocket = function() {
        // Serve Remote control APP files
        app.use(express.static(that.basepath));
        app.get('/', function (req, res) {
            res.sendfile(that.basepath + 'index.html');
        });

        // Handle Remote control commands
        this.io = socketio(app.listen(that.port));
        this.io.on('connection', function (client) 
        {
            // Web interface command is handled as "send to Machines"
            client.on('execute', function (data) {
                if (that.machine) {
                  if (data.to) that.machine.sendTo(data.to, 'execute', data);
                  else that.machine.send('execute', data);
                }
            });

            if (that.machine)
              client.emit('status', that.machine.status());
        });
        console.log ('WEBSERVER: started on port '+that.port);
    }

    // IS MACHINE READY
    this.ready = function() {
        return (that.io != null);
    }

    // Send to all Web Interface
    this.send = function(msg, data) {
        if (that.ready()) that.io.emit(msg, data);
        console.log(msg+': '+JSON.stringify(data))
    }

    // Attach Web Interface to a Peer Machine
    this.setMachine = function(machine) {
      this.machine = machine;
      this.machine.inform = that.send; // The trigger function of the Machine is linked to Web Interface send 
      this.send('status', this.machine.status());  // Send status to all Interfaces
    }
}

var exports = module.exports = function() { return new WebServer() };
