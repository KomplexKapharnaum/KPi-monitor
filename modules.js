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
	
	this._methods = {};
	this._process = null;
	this._events = null;

	this.do = function (name, data) {
		if (name && this._methods[name]) this._methods[name].fn(data);
		else this.default(data);
	}

	this.extends = function (name, fn) {
		this._methods[name] = new action(name, fn);
		return this._methods[name];
	}

	this.description = function() {
		var desc = {};
		for (var name in this._methods) desc[name] = {
				label: this._methods[name].label,
				args: this._methods[name].args
			}
		return desc;
	}

	this.setProcess = function(cmd, args) 
	{
		this._process = spawn(cmd, args);
		this._process.stdin.setEncoding('utf-8');
		this._process.stdout.on('data', that.read);
	}

	// Write to process
	this.write = function(msg) {
		if (this._process) this._process.stdin.write(msg+'\n');
	}

	// Read from process
	this.read = function(msg) {
		msg = String.fromCharCode.apply(null, new Uint16Array(msg));
		that.emit('/stdout', msg);
		//console.log('module says: '+msg);
	}

	// Default action
	this.default = function (data) {
		console.log('default action: '+data);
	};

	this.emit = function(event, data) {
        if (this._events) this._events.send(event, data);
    };
}

function Module (name) {

	if (name) return require('./modules/'+name+'.js')(base);
	else return base;
	this.load = function(name) {
		var base = this.base();
		if (name) return require('./modules/'+name+'.js')(base);
		else return base;
	}

	this.base = function() {
		return new BaseModule();
	}
}

var exports = module.exports = function(name) {
	if (name) return require('./modules/'+name+'.js')(new BaseModule());
	else return new BaseModule();
};