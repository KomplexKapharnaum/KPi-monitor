var spawn = require('child_process').spawn;

function action (path, fn) {

	this.fn = fn;
	this.label = path;
	this.args = {};

	this.describe = function(label, args) {
		this.label = label;
		this.args = args;
	}
}

function BaseModule () {
	var that = this;
	
	this.methods = {};
	this.process = null;

	this.do = function (name, data) {
		if (name && this.methods[name]) this.methods[name].fn(data);
		else this.default(data);
	}

	this.extends = function (name, fn) {
		this.methods[name] = new action(name, fn);
		return this.methods[name];
	}

	this.description = function() {
		var desc = {};
		for (var name in this.methods) desc[name] = {
				label: this.methods[name].label,
				args: this.methods[name].args
			}
		return desc;
	}

	this.setProcess = function(cmd, args) 
	{
		this.process = spawn(cmd, args);
		this.process.stdin.setEncoding('utf-8');
		this.process.stdout.on('data', that.read);
	}

	// Write to process
	this.write = function(msg) {
		if (this.process) this.process.stdin.write(msg+'\n');
	}

	// Read from process
	this.read = function(msg) {
		console.log('module says: '+msg);
	}

	// Default action
	this.default = function (data) {
		console.log('default action: '+data);
	};

}

function Module () {

	this.load = function(name) {
		var base = this.base();
		if (name) return require('./modules/'+name+'.js')(base);
		else return base;
	}

	this.base = function() {
		return new BaseModule();
	}
}

var exports = module.exports = function() {return new Module()};