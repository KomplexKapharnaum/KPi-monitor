
function Titreur ( module ) {
	if (!module) module = require('../modules.js')().base();

	// attach external process
	module.setProcess('./modules/bin/hardware6');
	var fs = require('fs');

	// set Titreur
	module.extends('titreur', (data) => {
			var cmd = 'texttitreur ';
	        if (data.type) 	cmd += ' -type ' + data.type;
	        if (data.speed) cmd += ' -speed ' + data.speed;
	        if (data.line1) cmd += ' -line1 ' + data.line1.replace(/ /g, '_');
	        if (data.line2) cmd += ' -line2 ' + data.line2.replace(/ /g, '_');
			module.write(cmd);
			fs.appendFile('/dnc/media/titrage.txt', data.line1 + ' — ' + data.line2 + '\n\r', function (err) { });

			//console.log('MODULE Titreur: '+cmd);
		})
		.describe('Titreur', {line1: 'text24', line2: 'text24'});

		// set Titreur
		module.extends('titreurbig', (data) => {
				var cmd = 'texttitreur ';
		        cmd += ' -type b';
		        if (data.line1b) cmd += ' -line1 ' + data.line1b.replace(/ /g, '_');
				module.write(cmd);
				//console.log('MODULE Titreur: '+cmd);
				fs.appendFile('/dnc/media/titrage.txt', 'B' + data.line1b + '\n\r', function (err) { });

			})
			.describe('Titreur BIG', {line1b: 'text12'});

			module.extends('titreur', (data) => {
					var cmd = 'texttitreur  -line1 __ -line2 __';
					module.write(cmd);

					//console.log('MODULE Titreur: '+cmd);
				})
				.describe('Titreur clear', {clear: 'push'});

	// INIT Card
	module.write('initconfig -carteVolt ? -name ? -ip ? -version ? -titreurNbr 6 -manualmode ? -status ?');
	console.log('MODULE Titreur: init');

	return module;
}

var exports = module.exports = Titreur;
