
function Kxkmcard ( module ) {
	if (!module) module = require('../modules.js')().base();

	// attach external process
	module.setProcess('./modules/bin/kxkmcard-fake');

	// set Relais
	module.extends('relais', (data) => {
			var cmd = 'setrelais ';
			cmd += (data.onoff)?'-on':'-off';
			module.write(cmd);
		})
		.describe('Relais', {onoff: 'toggle'});

	// set Led Teleco OK
	module.extends('ledtelecook', (data) => {
			var cmd = 'setledtelecook ';
			cmd += (data.onoff)?'-on':'-off';
			module.write(cmd);
		})
		.describe('Led Teleco OK', {onoff: 'toggle'});

	// set Led Carte OK
	module.extends('ledcarteok', (data) => {
			var cmd = 'setledcarteok ';
			cmd += (data.onoff)?'-on':'-off';
			module.write(cmd);
		})
		.describe('Led Carte OK', {onoff: 'toggle'});

	// set Titreur
	module.extends('titreur', (data) => {
			var cmd = 'texttitreur ';
	        if (data.type) 	cmd += ' -type ' + data.type;
	        if (data.speed) cmd += ' -speed ' + data.speed;
	        if (data.line1) cmd += ' -line1 ' + data.line1.replace(' ', '_');
	        if (data.line2) cmd += ' -line2 ' + data.line2.replace(' ', '_');
			module.write(cmd);
		})
		.describe('Titreur', {line1: 'text', line2: 'text'});

	// set Lights
	module.extends('lights', (data) => {
			var cmd = 'setlight ';
			if (data.strobe && parseInt(data.strobe) > 0) cmd += ' -strob '+parseInt(data.strobe);
			if (data.fade && parseInt(data.fade) > 0) cmd += ' -fade '+parseInt(data.fade);
			if (data.rgb) cmd += ' -rgb '	+parseInt(data.rgb[0])
								+' '+parseInt(data.rgb[1])
								+' '+parseInt(data.rgb[2]);
			if (data.led10w1) cmd += ' -10w1 '+parseInt(data.led10w1);
			if (data.led10w2) cmd += ' -10w2 '+parseInt(data.led10w2);
			module.write(cmd);
		})
		.describe('Lights', {strobe: 'int', fade: 'int', rgb: 'rgb', led10w1: 'int', led10w2: 'int'});

	// set Gyro
	module.extends('gyro', (data) => {
			var cmd = 'setgyro ';
	        if (data.speed) cmd += ' -speed '+parseInt(data.speed);
	        if (data.strob) cmd += ' -strob '+parseInt(data.strob);
	        if (data.mode) cmd += ' -mode '+parseInt(data.mode);
			module.write(cmd);
		})
		.describe('Gryo', {speed: 'int', strob: 'int', mode: 'int'});

	// INIT Card
	module.write('initconfig -carteVolt ? -name ? -ip ? -version ? -titreurNbr ? -manualmode ? -status ?');

	return module;
}

var exports = module.exports = Kxkmcard;