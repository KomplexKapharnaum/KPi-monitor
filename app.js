
console.log('Hello KPI-peers');

var PORT_WEBSERVER = 8088;
var BASEPATH = __dirname + '/www/';

// Modules
var Modules = require('./modules.js');

// PEER MACHINE
console.log('Starting PEERs Machine');
var PeerMachine = require('./peermachine.js')();

PeerMachine.attach( '/kxkmcard', Modules('kxkmcard') );
//PeerMachine.attach( '/titreur', Modules('titreur') );

PeerMachine.start({ min : 9000, max : 10000 });


//WEBSERVER
console.log('Starting Webserver');
var WebServer = require('./webserver.js')();
WebServer.start(PORT_WEBSERVER, BASEPATH);



// function hello() {
// 	PeerMachine.command('/echo', 'hello from '+PeerMachine.name());	
// 	//PeerMachine.command('/logger', 'world');	
// }
// setInterval(hello, 3000);

// function hello2() {
// 	console.log('-');
// }
// setInterval(hello2, 1000)


