
function Titreur ( module ) {
	if (!module) module = require('../modules.js')().base();

	// attach external process
	module.setProcess('./modules/bin/hardware6');

	// set Titreur
	module.extends('titreur', (data) => {
			var cmd = 'texttitreur ';
	        if (data.type) 	cmd += ' -type ' + data.type;
	        if (data.speed) cmd += ' -speed ' + data.speed;
	        if (data.line1) cmd += ' -line1 ' + data.line1.replace(' ', '_');
	        if (data.line2) cmd += ' -line2 ' + data.line2.replace(' ', '_');
			module.write(cmd);
			//console.log('MODULE Titreur: '+cmd);
		})
		.describe('Titreur', {line1: 'text', line2: 'text'});

	// INIT Card
	module.write('initconfig -carteVolt ? -name ? -ip ? -version ? -titreurNbr 6 -manualmode ? -status ?');
	console.log('MODULE Titreur: init');

	return module;
}

var exports = module.exports = Titreur;
