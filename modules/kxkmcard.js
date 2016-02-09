const spawn = require('child_process').spawn;

function Kxkmcard () {

	this.process = spawn('./modules/bin/kxkmcard-fake');

	this.process.stdin.setEncoding('utf-8');
	this.process.stdout.on('data', (data) => {
	  console.log(`kxkmcard says: ${data}`);
	});

	// Write to process
	this.write = function(msg) {
		this.process.stdin.write(msg+'\n');
	}

	// INIT Message
	this.write('initconfig -carteVolt ? -name ? -ip ? -version ? -titreurNbr ? -manualmode ? -status ?');

	this.setrelais = function(onoff) {
		var cmd = 'setrelais ';
		cmd += (onoff)?'-on':'-off';
		this.write(cmd);
	}

	this.setledtelecook = function(onoff) {
		var cmd = 'setledtelecook ';
		cmd += (onoff)?'-on':'-off';
		this.write(cmd);
	}

	this.setledcarteok = function(onoff) {
		var cmd = 'setledcarteok ';
		cmd += (onoff)?'-on':'-off';
		this.write(cmd);
	}

	this.texttitreur = function(data) {
		var cmd = 'texttitreur ';
        if (data.type) 	cmd += ' -type ' + data.type;
        if (data.speed) cmd += ' -speed ' + data.speed;
        if (data.line1) cmd += ' -line1 ' + data.line1.replace(' ', '_');
        if (data.line2) cmd += ' -line2 ' + data.line1.replace(' ', '_');
		this.write(cmd);
	}

	this.setlight = function(data) {
		var cmd = 'setlight ';
		if (data.strobe && parseInt(data.strobe) > 0) 
			cmd += ' -strob '+parseInt(data.strobe);
		if (data.fade && parseInt(data.fade) > 0) 
			cmd += ' -fade '+parseInt(data.fade);
		if (data.rgb)
			cmd += ' -rgb '	+parseInt(data.rgb[0])
							+' '+parseInt(data.rgb[1])
							+' '+parseInt(data.rgb[2]);
		if (data.led10w1) 
			cmd += ' -10w1 '+parseInt(data.led10w1);
		if (data.led10w2) 
			cmd += ' -10w2 '+parseInt(data.led10w2);
		this.write(cmd);
	}

	this.setgyro = function(data) {
		var cmd = 'setgyro ';
        if (data.speed)
            cmd += ' -speed '+parseInt(data.speed);
        if (data.strob)
            cmd += ' -strob '+parseInt(data.strob);
        if (data.mode)
            cmd += ' -mode '+parseInt(data.mode);
		this.write(cmd);
	}

	this.do = function(data) {
		this.process.stdin.write(data+'\n');
	}
}



var exports = module.exports = Kxkmcard;