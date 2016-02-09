
var PORT_WEBSERVER = 8088;
var BASEPATH = __dirname + '/www/';

// Modules
var Logger = require('./modules/logger.js');
//var Vlc = require('./modules/vlc.js');
var Kxkmcard = require('./modules/kxkmcard.js');

// PEER MACHINE
var PeerMachine = require('./peermachine.js')();
PeerMachine.attach( '/logger', new Logger() );
PeerMachine.attach( '/kxkmcard', new Kxkmcard() );
//PeerMachine.attach( '/video', new Vlc() );
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


