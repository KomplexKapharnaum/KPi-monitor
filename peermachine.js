var os = require('os');
var bonjour = require('bonjour')();
var portastic = require('portastic');
var socketio_server = require('socket.io');
var socketio_client = require('socket.io-client');

function PeerMachine()
{
    var that = this;
    this.type = 'KPi-peer';
    this.name = os.hostname();
    this.port = 0;
    this.server = null;
    this.outputs = {};
    this.inputs = {};
    this.clients = {};
    this.processor = {};

    /**
    OUTPUT To Peers
    **/

    this.startServer = function(portastic_options, connectOthers) {
        // Find free port
        portastic.find(portastic_options).then(function(ports) {
            that.createServer(ports[0]);
            if (connectOthers) that.connectPeers();
        });
    }

    this.addSpace = function (namespace) {
        if (this.server == null) return;

        this.outputs[namespace] = this.server.of(namespace);
        this.clients[namespace] = {};

        this.outputs[namespace].on('connection', function (client)
        {
            // New Peer Client declaring himself
            client.on('iam', function(data)
            {
                if (!that.clients[namespace].hasOwnProperty(data.peerid))
                    that.inform('addclient', {name: data.peerid, space: namespace});

                that.clients[namespace][data.peerid] = client;
                that.inform('status', that.status(), data.peerid);
            });

            // Peer client is gone
            client.on('disconnect', function(){
                for (var peerid in that.clients[namespace])
                    if (client.id == that.clients[namespace][peerid].id) {
                        delete that.clients[namespace][peerid];
                        that.inform('removeclient', {name: peerid, space: namespace});
                    }
            });
        });
    }

    // OUTPUT CHANNEL: Create a Server and wait for Peers to connect as client
    this.createServer = function(port) {
        this.port = port;
        this.name += ' '+port;

        this.server = socketio_server(port);
        this.addSpace('/execute');
        this.addSpace('/inform');

        // Inform Status to already connected interfaces
        this.inform('status', this.status());

        // Advertize Server
        bonjour.publish({ name: this.name, type: this.type, port: this.port });
        console.log ('PEERMACHINE: "'+this.name+'" started on port '+this.port);
    }

    // IS MACHINE READY
    this.ready = function(channel) {
        return (channel && this.outputs[channel] !== undefined);
    }

    // LINKED By somebody: inform complete status
    this.status = function() {
        if (!this.ready()) return null;

        // list available peers
        var status = {peers: Object.keys(that.clients)};

        // list available methods in processor
        if (this.processor)
            status.method = Object.getOwnPropertyNames(that.processor).filter(function (p) {
                return typeof that.processor[p] === 'function';
            });

        return status;
    }

    // INFORM send on /inform channel
    this.inform = function(msg, data, to) {
        this.send('/inform', msg, data, to);
    }

    // COMMAND send on /execute channel
    this.execute = function(cmd, dat, to) {
        this.send('/execute', 'to-processor', {command: cmd, data:dat}, to);
    }

    // ANSWER to sender
    this.answer = function(msg, origin, dat) {
        if (!dat) dat = {};
        dat.original_data = origin;
        this.send(origin.channel, msg, dat, origin.from);
    }

    // SEND TO CLIENTS (ON OUTPUT channel)
    this.send = function(channel, msg, data, to) {
        if (this.ready(channel)) {
            if (!data) data = {};
            data.from = this.name;
            data.channel = channel;
            if (!to && data.to) to = data.to;
            if (!to) this.outputs[channel].emit(msg, data);
            else if (this.clients[channel][to]) {
                data.to = to;
                this.clients[channel][to].emit(msg, data);
            }
        }
        //console.log(channel, msg, data, to);
    }

    /**
    INPUT From Peers
    **/

    // INPUT CHANNEL: search for PEER servers and connect to receive commands
    this.connectPeers = function()
    {
        // Search for other Peers
        bonjour.find({ type: this.type }, function (service)
        {
            // Connect to PEERS EXECUTE Channel
            that.inputs[service.name] = socketio_client('http://'+service.host+':'+service.port+'/execute');

            // Identify myself
            that.inputs[service.name].on('connect', function(){
                that.inputs[service.name].emit('iam', {peerid: that.name});
            });

            // transfer incoming to local processor
            that.inputs[service.name].on('to-processor', function(data) {
                that.process(data);
            });

            // answer received from remote processor
            that.inputs[service.name].on('from-processor', function(data) {
                console.log(data);
            });
        });
    }



    // LINK A PROCESSOR to execute commands
    this.setProcessor = function(processor) {
        this.processor = processor;
        this.inform('status', this.status());
    }

    // TRANSFER INCOMING MESSAGE TO PROCESSOR
    this.process = function(data) {
        if (!data.command)
            that.answer('from-processor', data, {errorcode: 'command_missing'});

        else if (!this.processor || !that.processor[data.command])
            that.answer('from-processor', data, {errorcode: 'processor_missing'});

        else {
            var res = that.processor[data.command](data.data);
            if (res && res['doAnswer'])
                that.answer('from-processor', data, {result: res});
        }
    }
}

var exports = module.exports = function() { return new PeerMachine() };
