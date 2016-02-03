
function ActionParser() {

	this.log = function(data) {
		console.log(data);
		return {success: true};
	}

}


var exports = module.exports = function() { return new ActionParser() };