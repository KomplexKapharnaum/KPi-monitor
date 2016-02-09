const spawn = require('child_process').spawn;

function Vlc () {

	this.process = spawn('cvlc', ['-I', 'rc']);

	this.process.stdin.setEncoding('utf-8');
	this.process.stdout.on('data', (data) => {
	  //console.log(`stdout: ${data}`);
	});

	this.play = function(data) {
		this.process.stdin.write('add '+data+'\n');
	}

	this.stop = function() {
		this.process.stdin.write('stop'+'\n');
	}

	this.do = function(data) {
		this.process.stdin.write(data+'\n');
	}
}



var exports = module.exports = Vlc;