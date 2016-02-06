
function Logger(id) {
	
	this.id = id;

	this.do = function(data) {
		console.log('default logger:'+data);
		return {success: true};
	}

	this.log = function(data) {
		console.log('log logger:'+data);
		return {success: true};
	}

}


var exports = module.exports = Logger;