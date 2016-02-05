
var PORT_WEBSERVER = 8088;
var BASEPATH = __dirname + '/www/';

// ACTION PARSER
var ActionParser = require('./actionparser.js')();

// PEER MACHINE
var PeerMachine = require('./peermachineMono.js')();
//PeerMachine.setProcessor(ActionParser);
PeerMachine.start({ min : 9000, max : 10000 });

// function hello() {
// 	PeerMachine.execute('log', 'YO!', 'KPi peer 9001');
// }
// setInterval(hello, 1000);

//WEBSERVER
var WebServer = require('./webserver.js')();
//WebServer.start(PORT_WEBSERVER, BASEPATH);
