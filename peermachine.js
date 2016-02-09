var portastic = require('portastic');
var Server = require('./server.js')

function PeerMachine()
{
    var that = this;
    this.server = null;
    this.processors = [];

    /**
    SERVERS
    **/

    this.start = function(portastic_options) {
        // Find free port
        portastic.find(portastic_options).then(function(ports) {
            var port = ports[0];
            //port = ports[Math.floor(Math.random()*ports.length)];
            
            that.server = new Server(port, 'KPi-peer');

            // create Inform Channel
            var radio = that.server.addChannel('/info');

            // create P2P Channel
            var p2p = that.server.addChannel('/peer').p2p();

            // Route MACHINE input to attached processors, send State to radio
            p2p.on('/input', that.process);
            p2p.on('/state', radio.send);
            
            // inform new RADIO client of Machine status (known peers and methods)
            radio.on('/state/newclient', function(ev, cli) {
                var status = {
                    peers: Object.keys(p2p.activePeers()),
                    methods: that.getMethods()
                };
                radio.send('/status', status, cli);
            });

            p2p.on('/output', function(cmd, data) {
                //console.log('OUTPUT: ', cmd, data);
            })

            // Declare Bonjour
            that.server.advertize();
        });
    }

    

    this.process = function(path, message) {
        var cmd = path.split('/');  // cmd[1] is the processor id, cmd[2] is the method call
        if (!cmd[2]) cmd[2] = 'do'; // default method if none provided
        for (var proc of that.processors) 
            if (proc._procid == '/'+cmd[1] && proc.hasOwnProperty(cmd[2])) {
                var ans = proc[ cmd[2] ](message.data);
            }
        //console.log('CMD: '+path+' '+JSON.stringify(message.data));
    }

    this.attach = function(id, object) {
        object._procid = id;
        this.processors.push(object);
    }

    // list available methods in processors
    this.getMethods = function() {
        var methods = {};
        for (var proc of this.processors) {
            if (! methods[ proc._procid ]) methods[ proc._procid ] = [];
            for (var p in proc) 
                if (typeof proc[p] === 'function' && p != 'do') methods[ proc._procid ].push(p);
        }
        return methods;
    }

    // Get name
    this.name = function() {
        if(that.server) return this.server.name;
    }

    // TOOLS
    this.command = function(cmd, data, to) {
        if(that.server) that.server.channel('/peer').send(cmd, data, to);
    }
    
    this.publish = function(news, data) {
        if(that.server) that.server.channel('/info').send(news, data);
    }
}

var exports = module.exports = function() { return new PeerMachine() };
