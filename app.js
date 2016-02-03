
var PORT_WEBSERVER = 8080;
var BASEPATH = __dirname + '/www/';

// ACTION PARSER
var ActionParser = require('./actionparser.js')();

// PEER MACHINE
var PeerMachine = require('./peermachine.js')();
PeerMachine.setProcessor(ActionParser);
PeerMachine.startServer({ min : 9000, max : 10000 }, true);

function hello() {
	PeerMachine.execute('log', 'YO!', 'KPi peer 9001');
}
setInterval(hello, 1000);

// WEBSERVER
// var WebServer = require('./webserver.js')();
// WebServer.start(PORT_WEBSERVER, BASEPATH);
// WebServer.setMachine(PeerMachine);







