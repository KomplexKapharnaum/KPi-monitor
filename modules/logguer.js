
function Logguer ( module ) {
	if (!module) module = require('../modules.js')().base();

	// set Titreur
	module.extends('log', (data) => {
			console.log('MODULE logguer: ', data);
		})

	// INIT Card
	// module.write('initconfig -carteVolt ? -name ? -ip ? -version ? -titreurNbr 6 -manualmode ? -status ?');
	console.log('MODULE logguer: init');

	return module;
}

var exports = module.exports = Logguer;
