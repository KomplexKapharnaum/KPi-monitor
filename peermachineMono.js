var os = require('os');
var bonjour = require('bonjour')();
var portastic = require('portastic');
var socketio_server = require('socket.io');
var socketio_client = require('socket.io-client');
var socketio_wildcard = require('socketio-wildcard');

function Channel(device, namespace) {
    var that = this;

    this.device = device;
    this.channel = namespace;
    this.slaves = {};         // remote Clients connected to my server
    this.masters = {};        // own Clients connected to remote servers

    // Create MASTER Server
    this.server = this.device.server.of(namespace);
    this.server.use(socketio_wildcard());
    this.server.on('connection', function (client)
    {
        // New Slave trying to connect
        client.on('iam', function(name) {
            var slave = {
                    io: client,
                    name: name,
                    status: (that.masters[name] ? 'dropped' : 'accepted') // Accept if master do not exist already
                };

            // register that slave
            that.slaves[name] = slave;
            that.enrole(slave);
            client.emit(slave.status);

            //that.inform('status', that.status(), data.peerid);
            console.log('Slave connected: '+name+' with status '+slave.status);
        });

        // Slave is gone
        client.on('disconnect', function(){
            for (var name in that.slaves)
                if (client.id == that.slaves[name].io.id) {
                    delete that.slaves[name];
                    console.log('Slave disconnected: '+name);
                    // that.inform('removeclient', {name: peerid, space: namespace});
                }
        });
    });

    // Search for other MASTERS
    this.connectOthers = function() {
        bonjour.find({ type: this.device.type }, function (service)
        {
            // Check if slave exist
            if (that.slaves[service.name] && that.slaves[service.name].status != 'dropped') return;

            // Check if not already known
            if (that.masters[service.name] || service.name == that.device.name) return;

            // Connect to master
            var master = {
                    io: socketio_client('http://'+service.name+that.channel),
                    statut: 'connecting',
                    name: service.name,
                    drop: function() { this.status = 'dropped'; this.io.disconnect(); }
                }
            socketio_wildcard(socketio_client.Manager)(master.io);

            master.io.on('connect', function(){ master.io.emit('iam', that.device.name); });
            master.io.on('dropped', master.drop);
            master.io.on('accepted', function(){
                // Check if my master did not already accept him as slave
                if (that.slaves[service.name] && that.slaves[service.name].status != 'dropped') {
                        master.drop()
                        console.log('late drop');
                }
                else master.status = 'accepted';
            });

            that.enrole(master);
        });
    }

    this.enrole = function(peer) {
        peer.io.on('*', function(input){
            //if (peer.status == 'dropped') return;
            var event = input.data[0];
            var data = input.data[1];
            if (event == 'accepted' || event == 'dropped') return;
            that.device.trigger(event, data);
        });
    }

    this.peers = function(status) {
        var peers = {};
        for (var name in this.masters)
            if (!status || status == this.masters[name].status)
                peers[name] = this.masters[name];

        for (var name in this.slaves)
            if (!status || status == this.slaves[name].status)
                peers[name] = this.slaves[name];

        return peers;
    }

    this.send = function(msg, data, to) {
        if (!data) data = {};
        data.from = this.device.name;
        data.channel = this.channel;
        if (!to && data.to) to = data.to;

        var peers = this.peers('accepted');

        // Send to all
        if (!to)
            for (var name in peers) peers[name].io.emit(msg, data);

        // Send to device
        else {
            data.to = to;
            if (peers[to]) peers[to].io.emit(msg, data);
        }
        //console.log(msg, data, to);
    }

}

function PeerMachine()
{
    var that = this;

    this.type = 'KPi-peer';
    this.name = os.hostname();
    this.port = 0;
    this.server = null;
    this.spaces = {};

    this.processor = {};

    /**
    SERVERS
    **/

    this.start = function(portastic_options) {
        // Find free port
        portastic.find(portastic_options).then(function(ports) {
            that.createDevice(ports[0]);
        });
    }

    // MACHINES: Create a Servers
    this.createDevice = function(port) {
        this.port = port;
        this.name += ':'+port;

        // open socket.io server
        this.server = socketio_server(port);

        // create P2P Machine
        this.machine = new Channel(this, '/peer');
        this.machine.connectOthers();

        // create Inform Server
        this.inform = new Channel(this, '/info');

        // Advertize Device
        bonjour.publish({ name: this.name, type: this.type, port: this.port });
        console.log ('PEERMACHINE: "'+this.name+'" started on port '+this.port);
    }

    this.trigger = function(event, data) {
        console.log('EVENT: '+event+' with data: '+data);
    }


    // // LINKED By somebody: inform complete status
    // this.status = function() {
    //
    //     // list known peers
    //     var status = {peers: that.peers};
    //
    //     // clients
    //     status.clients = {};
    //     for (channel in that.clients)
    //       status.clients[channel] = Object.keys(that.clients[channel]);
    //
    //     // list available methods in processor
    //     if (this.processor)
    //         status.method = Object.getOwnPropertyNames(that.processor).filter(function (p) {
    //             return typeof that.processor[p] === 'function';
    //         });
    //
    //     //console.log(status);
    //     return status;
    // }
    //
    // // INFORM send on /inform channel
    // this.inform = function(msg, data, to) {
    //     this.send('/inform', msg, data, to);
    // }
    //
    // // COMMAND send on /execute channel
    // this.execute = function(cmd, dat, to) {
    //     this.send('/execute', 'do', {command: cmd, data:dat}, to);
    // }
    //
    // // ANSWER to sender
    // this.answer = function(msg, origin, dat) {
    //     if (!dat) dat = {};
    //     dat.original_data = origin;
    //     this.send(origin.channel, msg, dat, origin.from);
    // }
    //
    // // LINK A PROCESSOR to execute commands
    // this.setProcessor = function(processor) {
    //     this.processor = processor;
    //     this.inform('status', this.status());
    // }
    //
    // // TRANSFER INCOMING MESSAGE TO PROCESSOR
    // this.process = function(data) {
    //     if (!data.command)
    //         that.answer('did', data, {errorcode: 'command_missing'});
    //
    //     else if (!this.processor || !that.processor[data.command])
    //         that.answer('did', data, {errorcode: 'processor_missing'});
    //
    //     else {
    //         var res = that.processor[data.command](data.data);
    //         if (res && res['doAnswer'])
    //             that.answer('did', data, {result: res});
    //     }
    // }
}

var exports = module.exports = function() { return new PeerMachine() };
