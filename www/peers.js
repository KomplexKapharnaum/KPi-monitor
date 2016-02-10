
function widget (id, type) {
  if (type == 'toggle') return $('<input type="checkbox" name="'+id+'" value="1" placeholder="'+id+'">');
  else if (type == 'text') return $('<input type="text" name="'+id+'" size="10" value="" placeholder="'+id+'">');
  else if (type == 'int') return $('<input type="text" name="'+id+'" size="1" value="" placeholder="'+id+'">');
}

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
        if (!that.alive()) {
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
}

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
    for (var path in methods) {
      var module = $('<div class="module"><h4>'+path+'</h4></div>').appendTo(span);
      var moduleBody = $('<div class="moduleBody"></div>').appendTo(module);
      for (var action in methods[path]) {
        var act = methods[path][action];
        var field = $('<form class="action">'+act.label+': </form>').appendTo(moduleBody);
        field.data('path', path+'/'+action);
        for (var arg in act.args) field.append( widget(arg, act.args[arg]) );
        $('<button type="submit" class="execute">GO</button>').appendTo(field);
        field.submit(function(e){
            e.preventDefault(); //Prevent the normal submission action
            var data = {};
            for (var input of $(this).serializeArray()) data[ input.name ] = input.value;
            that.io['execute'].emit($(this).data('path'), {data:data});
        });
      }
    }
  }
  
  this.dom.find(".play").on('click', function() {
    //that.io['execute'].emit('/video/play', {data:'/home/mgr/Videos/Test/trailer_720p.mov'});
    that.io['execute'].emit('/kxkmcard/setrelais', {data:true});
  });

  this.dom.find(".stop").on('click', function() {
    //that.io['execute'].emit('/video/stop');
    that.io['execute'].emit('/kxkmcard/setrelais', {data:false});
  });
  //console.info('New Peer added: '+this.url);

  //Open EXECUTE channel
  this.io['execute'] = io.connect(url+'/peer');
  this.io['execute'].on('connect', function(){
      that.io['execute'].emit('iam', {name: 'interface', type: 'interface'});
  });
  //this.io['execute'].on('do', function(data) { console.info(data); });
  //this.io['execute'].on('did', function(data) { console.info(data); });

  // Open INFORM channel
  this.io['inform'] = io.connect(url+'/info');
  this.io['inform'].on('connect', function(){
      that.io['inform'].emit('iam', {name: 'interface', type: 'interface'} );
      //console.info('Peer connected: '+that.url);
  });
  this.io['inform'].on('accept', function(data) {
      //console.info('Peer accepted: '+that.url);
      that.io['inform'].emit('getstatus');
      that.isalive = true;
      that.onStateChange(that);
  });
  this.io['inform'].on('/status', function(message) {
    //console.info('STATUS '+JSON.stringify(message.data));
    
    that.update(message.data.methods);

    if (message.data.peers.length > 0)
      that.collec.addPeers(message.data.peers);
  });
  this.io['inform'].on('/newclient', function(message) {
    that.collec.addPeers(message.data);
  });
  this.io['inform'].on('/newserver', function(message) {
    that.collec.addPeers(message.data);
  });
  this.io['inform'].on('disconnect', function() {
    //console.info('Peer disconnected: '+that.url);
    that.isalive = false;
    that.onStateChange(that);
  });

  this.onStateChange = function(el) {};
  this.alive = function() {return that.isalive;};
}

$(function() {
  var peerCollection = new PeerCollection( $('#viewport') );
});





