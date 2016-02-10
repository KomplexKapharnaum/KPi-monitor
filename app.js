
var PORT_WEBSERVER = 8088;
var BASEPATH = __dirname + '/www/';

// Modules
var Modules = require('./modules.js')();

// PEER MACHINE
var PeerMachine = require('./peermachine.js')();
PeerMachine.attach( '/kxkmcard', Modules.load('kxkmcard') );
PeerMachine.attach( '/titreur', Modules.load('titreur') );
PeerMachine.start({ min : 9000, max : 10000 });


//WEBSERVER
var WebServer = require('./webserver.js')();
WebServer.start(PORT_WEBSERVER, BASEPATH);



function hello() {
	PeerMachine.command('/echo', 'hello from '+PeerMachine.name());	
	//PeerMachine.command('/logger', 'world');	
}
setInterval(hello, 3000);

// function hello2() {
// 	console.log('-');
// }
// setInterval(hello2, 1000)


