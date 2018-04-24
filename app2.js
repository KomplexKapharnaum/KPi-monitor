

// PEER MACHINE
var PeerMachine = require('./peermachine.js')();

PeerMachine.on( 'logguer.log',
	(data, from)=>{
		if (from != PeerMachine.name()) console.log('received', data, ' <- ',from)
		else console.log('received', data, ' <- ME')
	});

PeerMachine.start();



function hello() {
	PeerMachine.broadcast('logguer.log', 'hello');
	// PeerMachine.name()

	//PeerMachine.command('/logger', 'world');
}
setInterval(hello, 3000);

// function hello2() {
// 	console.log('-');
// }
// setInterval(hello2, 1000)
