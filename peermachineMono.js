var os = require('os');
var bonjour = require('bonjour')();
var portastic = require('portastic');
var socketio_server = require('socket.io');
var socketio_client = require('socket.io-client');
var socketio_wildcard = require('socketio-wildcard');

const STATE_DROPPED = 0;
const STATE_CONNECTING = 1;
const STATE_ACCEPTED = 2;

function P2P(peer) {

    peer.masters = {};        // own Clients connected to remote servers

    peer.isConnectedTo = function(name) {
        if (peer.slaves[name]) return (peer.slaves[name].status > STATE_DROPPED);
        else if (peer.masters[name]) return (peer.masters[name].status > STATE_DROPPED);
        return false;
    }

    peer.peers = function(status) {
        var peers = {};

        var m = [];
        for (var name in peer.masters)
            if (!status || status == peer.masters[name].status) {
                peers[name] = peer.masters[name];
                m.push(name);
            }

        var s = [];
        for (var name in peer.slaves)
            if (!status || status == peer.slaves[name].status) {
                peers[name] = peer.slaves[name];
                s.push(name);
            }

        // console.log(' ');
        // console.log('IAM: '+peer.device.name);
        // console.log('MASTER of: '+JSON.stringify(s));
        // console.log('SLAVE to: '+JSON.stringify(m));
        // console.log('--');

        return peers;
    }

    // Search for other MASTERS
    bonjour.find({ type: peer.device.type }, function (service)
    {
        // Inform
        var url = 'http://'+service.name;
        peer.inform('newpeer', service.name);

        // Check if a connection already exist
        if (peer.isConnectedTo(service.name)) return;
        else if (service.name == peer.device.name) return;

        // Connect to master
        var master = {
                io: socketio_client(url+peer.channel),
                statut: STATE_CONNECTING,
                name: service.name,
                drop: function() { this.status = STATE_DROPPED; this.io.disconnect(); },
                accept: function() { this.status = STATE_ACCEPTED; peer.enrole(this); }
            }
        socketio_wildcard(socketio_client.Manager)(master.io);

        master.io.on('connect', function(){ master.io.emit('_iam', peer.device.name); });
        master.io.on('_drop',    function() { master.drop() });
        master.io.on('_accept',  function(){
            if (peer.isConnectedTo(service.name)) master.drop();
            else master.accept();
        });
        peer.masters[service.name] = master;
    });

}


function Server(device, namespace) {
    var that = this;

    this.device = device;
    this.channel = namespace;
    this.slaves = {};         // remote Clients connected to my server
    this.newsfeed = null;     // where to advertize events

    // Create MASTER Server
    this.server = this.device.server.of(namespace);
    this.server.use(socketio_wildcard());
    this.server.on('connection', function (client)
    {
        // New Slave trying to connect
        client.on('_iam', function(name) {
            var slave = {
                    io: client,
                    name: name,
                    status: STATE_CONNECTING,
                    drop: function() { this.status = STATE_DROPPED; this.io.emit('_drop'); },
                    accept: function() { this.status = STATE_ACCEPTED; this.io.emit('_accept'); that.enrole(this); }
                };

            if (that.isConnectedTo(name)) slave.drop();
            else slave.accept();

            // register that slave
            that.slaves[name] = slave;

            //that.onNewSlave(name);
            //that.device.inform('status', that.device.status(), name);
            //console.log('Slave connected: '+name+' with status '+slave.status);
        });

        client.on('_getstatus', function() {
            that.send('status', that.device.status(), that.find(client).name );
        });

        // Slave is gone
        client.on('disconnect', function(){
            var s = that.find(client);
            if (s) delete that.slaves[ s.name ];    
        });
    });

    this.plug = function(server) {
        this.newsfeed = server;
    }

    this.inform = function(msg, data) {
        if (this.newsfeed) this.newsfeed.send(msg, data);
    }

    this.find = function(client) {
        for (var name in that.slaves)
            if (client.id == that.slaves[name].io.id) return that.slaves[name];
    }

    this.isConnectedTo = function(name) {
        if (this.slaves[name]) return (this.slaves[name].status > STATE_DROPPED);
        return false;
    }

    this.enrole = function(peer) {
        peer.io.on('*', function(input){
            if (peer.status == STATE_DROPPED) return;
            var path = input.data[0];
            if (path[0] != '/') return;
            var data = input.data[1];
            that.device.trigger(path, data);
        });
    }

    this.peers = function(status) {
        var peers = {};

        for (var name in this.slaves)
            if (!status || status == this.slaves[name].status)
                peers[name] = this.slaves[name];

        //console.log('only slaves');
        return peers;
    }

    this.send = function(cmd, payload, to) {
        var message = {
            from: this.device.name,
            channel: this.channel,
            data: payload,
            to: to 
        };

        var peers = this.peers(STATE_ACCEPTED);

        // Send to all
        if (!to) {
            for (var name in peers) peers[name].io.emit(cmd, message);
            this.device.trigger(cmd, message);
        }

        // Send to device
        else if (peers[to]) peers[to].io.emit(cmd, message);
        else if (to == this.device.name) this.device.trigger(cmd, message);

        //console.log(msg, data, to);
    }

    this.p2p = function() {
        P2P(this);
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

    this.processors = [];

    /**
    SERVERS
    **/

    this.start = function(portastic_options) {
        // Find free port
        portastic.find(portastic_options).then(function(ports) {
            //var port = ports[Math.floor(Math.random()*ports.length)];
            var port = ports[0];
            that.createDevice(port);
        });
    }

    // MACHINES: Create a Servers
    this.createDevice = function(port) {
        this.port = port;
        this.name += ':'+port;

        // open socket.io server
        this.server = socketio_server(port);

        // create Inform Server
        this.radio = new Server(this, '/info');

        // create P2P Machine
        this.machine = new Server(this, '/peer');
        this.machine.p2p();
        this.machine.plug( this.radio );

        // Advertize Device
        bonjour.publish({ name: this.name, type: this.type, port: this.port });
        console.log ('PEERMACHINE: "'+this.name+'" started on port '+this.port);
    }

    this.trigger = function(path, message) {
        var cmd = path.split('/');  // cmd[1] is the processor id, cmd[2] is the method call
        if (!cmd[2]) cmd[2] = 'do'; // default method if none provided
        for (var proc of this.processors) 
            if (proc.id == '/'+cmd[1] && proc.hasOwnProperty(cmd[2])) {
                var ans = proc[ cmd[2] ](message.data);
            }
            //else console.log(pro)

        //console.log('CMD: '+path+' '+JSON.stringify(message.data));
    }

    this.use = function(object) {
        this.processors.push(object);
    }

    this.command = function(cmd, data, to) {
        this.machine.send(cmd, data, to);
    }
    
    this.publish = function(news, data) {
        this.radio.send(news, data);
    }


    // Produce Device statut
    this.status = function() {
    
        // list known peers
        var status = {peers: Object.keys(this.machine.peers(STATE_ACCEPTED))};
    
        // list available methods in processors
        for (var proc of this.processors)
            status.methods = Object.getOwnPropertyNames(proc).filter(function (p) {
                return (typeof proc[p] === 'function' && p != 'do');
            });
    
        //console.log(status);
        return status;
    }
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
