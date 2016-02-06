
var PORT_WEBSERVER = 8088;
var BASEPATH = __dirname + '/www/';

// Modules
var Logger = require('./modules/logger.js');


// PEER MACHINE
var PeerMachine = require('./peermachineMono.js')();
PeerMachine.use( new Logger('/logger') );
PeerMachine.start({ min : 9000, max : 10000 });




// function hello() {
// 	PeerMachine.command('/logger/log', 'hello from '+PeerMachine.name);	
// 	//PeerMachine.command('/logger', 'world');	
// }
// setInterval(hello, 3000);

// function hello2() {
// 	console.log('-');
// }
// setInterval(hello2, 1000)

//WEBSERVER
var WebServer = require('./webserver.js')();
WebServer.start(PORT_WEBSERVER, BASEPATH);
