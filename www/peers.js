
const P2P_MODE = true;
const DEVICENAME = 'inerface';

function widget (id, type) {
  if (type == 'toggle') return $('<input type="checkbox" name="'+id+'" value="1" placeholder="'+id+'">');
  else if (type == 'text') return $('<br /><input type="text" name="'+id+'" size="20" value="" placeholder="'+id+'">');
  else if (type == 'int') return $('<input type="text" name="'+id+'" size="1" value="" placeholder="'+id+'">');
}

function connect(url) {
  var con = io.connect(url);
  con.on('connect', function(){
      this.emit('iam', {name: DEVICENAME, type: 'interface'});
  });
  return con;
}

/*****************
** PEER COLLECTION *
******************/
function PeerCollection( placeholder ) {
    var that = this;
    this.peers = {};
    this.viewport = placeholder;

    this.addPeers = function(peers) {
      for(var name in peers) this.add(name, peers[name]);
        //console.info('addpeers: ',peers);
    }

    this.add = function(name, url) {
      if (this.size() == 0) this.viewport.empty();
      name = name.replace(':','-');  //clean name (used as id)
      if (this.peers[name]) return;
      this.peers[name] = new Peer(this, name, url);
      this.viewport.append(this.peers[name].dom);

      this.peers[name].onStateChange = function(peer) {
        if (!peer.alive() && !that.alive()) that.starter();
        that.update();
      }
    }

    this.update = function() {
      // BUILD / UPDATE DOM
      for (var name in this.peers)
        $('#'+name).toggleClass('peerActive', that.peers[name].alive());

    }

    this.size = function() {
      return Object.keys(this.peers).length;
    }

    this.alive = function() {
      for (var n in this.peers) 
        if (this.peers[n].alive()) return true;
      return false; 
    }

    this.starter = function() {
      this.socket = io.connect();
      this.socket.on('peers', function (peers) {
        // Disconnect webserver if P2P mode enabled
        if (!that.alive() || !P2P_MODE) {
          console.info('catching back webserver');
          that.addPeers(peers);
        }
        else {
          that.socket.disconnect();
          console.info('dropping webserver');
        }
      });
    }

    this.starter();
    //programmation2@klein-decoupe-service.fr
}

/*****************
** PEER *********
******************/
function Peer(collec, name, url) {
  var that = this;

  this.collec = collec;
  this.name = name;
  this.url = url;
  this.io = {};
  this.isalive = false;

  this.dom = $('<div id="'+name+'" class="peer"><h3>.:: '+name+' ::.</h3><span class="moduleslist"></span></div>');

  this.update = function(methods) {
    var span = this.dom.find('.moduleslist');
    span.empty();

    // modules
    for (var path in methods) {
      
      var module = new Module(path, methods[path], that.io['/peer'], this.url);
      module.dom.appendTo(span);
    }
  }
  
  //console.info('New Peer added: '+this.url);

  //Open EXECUTE channel
  this.io['/peer'] = connect(url+'/peer');

  // Open event channel
  this.io['/event/peer'] = connect(url+'/event/peer');
  
  this.io['/event/peer'].on('accept', function(data) {
      that.isalive = true;
      that.onStateChange(that);
  });

  this.io['/event/peer'].on('/status', function(message) {
    //console.info('STATUS '+JSON.stringify(message.data));  
    that.update(message.data.methods);

    if (message.data.peers.length > 0)
      that.collec.addPeers(message.data.peers);
  });

  this.io['/event/peer'].on('/newclient', function(message) {
    that.collec.addPeers(message.data);
  });
  
  this.io['/event/peer'].on('/newserver', function(message) {
    that.collec.addPeers(message.data);
  });
  
  this.io['/event/peer'].on('disconnect', function() {
    //console.info('Peer disconnected: '+that.url);
    that.isalive = false;
    that.onStateChange(that);
  });

  this.onStateChange = function(el) {};
  this.alive = function() {return that.isalive;};
}

/*****************
** MODULE BLOCK **
******************/
function Module(path, methods, output, peerurl) {
  var that = this;
  this.output = output;
  this.path = path;
  this.dom = $('<div class="module"><h4>'+path+'</h4></div>');
  this.body = $('<div class="moduleBody"></div>').appendTo(this.dom);

  this.dom.find('h4').on('click', function() {
    that.body.toggle();
  });

  this.addAction = function(action, act) {
    var field = $('<form class="action">'+act.label+'&#09;</form>').appendTo(this.body);
    field.data('path', path+'/'+action);

    // add parameters
    for (var arg in act.args) field.append( widget(arg, act.args[arg]) );
    $('<button type="submit" class="execute">GO</button>').appendTo(field);

    // On validate action
    field.submit(function(e){
        e.preventDefault();
        var data = {};
        for (var input of $(this).serializeArray()) data[ input.name ] = input.value;
        output.emit( $(this).data('path'), {data:data});
    });
  }

  // add actions
  for (var action in methods) 
    this.addAction( action, methods[action] );

  // log area
  var logdiv = $('<div class="log"><h4>LOG</h4></div>').appendTo(this.body);
  this.logarea = $('<div class="logbody"></div>').appendTo(logdiv);
  logdiv.find('h4').on('click', function() {
    that.logarea.toggle();
  });


  // attach event io
  this.input = connect(peerurl+'/event'+path);
  this.input.on('/stdout', function(message) {
    //console.info('/event'+path+'/stdout ',message.data);
    that.logarea.prepend(message.data+'<br />');
  });

  console.info('Created Module '+path);

}

$(function() {
  var peerCollection = new PeerCollection( $('#viewport') );
});





