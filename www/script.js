
function PeerCollection() {
    var that = this;
    this.peers = {};

    this.addPeers = function(peers) {
      for(p of peers) this.add(p);
    }

    this.add = function(url) {
      var name = url.replace(':','');
      if (this.peers[name]) return;
      this.peers[name] = new Peer('http://'+url);

      $('#viewport').append('<div id="'+name+'">Peer '+name+': <span class="off">link</span></div>');

      this.peers[name].onStateChange = function(peer) {
        if (!peer.alive() && !that.alive()) that.starter();
        that.update();
      }
    }

    this.update = function() {
      // BUILD / UPDATE DOM
      for (var name in this.peers) {
        if(this.peers[name].alive()) 
          $('#'+name+' span').show();
        else
          $('#'+name+' span').hide();
        //$('#'+name+' span').toggleClass("on");
      }
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
          //console.info('catching back webserver');
          peerCollection.addPeers(peers);
        }
        else {
          that.socket.disconnect();
          //console.info('dropping webserver');
        }
      });
    }

    this.starter();
}

function Peer(url, parent) {
  var that = this;

  this.url = url;
  this.io = {};
  this.isalive = false;
  this.parent = parent;

  //console.info('New Peer added: '+this.url);

  // Open EXECUTE channel
  this.io['execute'] = io.connect(url+'/peer');
  this.io['execute'].on('connect', function(){
      that.io['execute'].emit('iam', {peerid: 'interface'});
  });
  this.io['execute'].on('do', function(data) { console.info(data); });
  this.io['execute'].on('did', function(data) { console.info(data); });

  // Open INFORM channel
  this.io['inform'] = io.connect(url+'/info');
  this.io['inform'].on('connect', function(){
      that.io['inform'].emit('_iam', 'interface');
      //console.info('Peer connected: '+that.url);
  });
  this.io['inform'].on('_accept', function(data) {
      that.io['inform'].emit('_getstatus');
      that.isalive = true;
      that.onStateChange(that);
  });
  this.io['inform'].on('status', function(message) {
    //  console.info(message);
    if (message.data.peers.length > 0)
      peerCollection.addPeers(message.data.peers);
  });
  this.io['inform'].on('newpeer', function(message) {
    peerCollection.addPeers([message.data]);
  });
  this.io['inform'].on('disconnect', function() {
    //console.info('Peer disconnected: '+that.url);
    that.isalive = false;
    that.onStateChange(that);
  });

  this.onStateChange = function(el) {};
  this.alive = function() {return this.isalive};
}

var peerCollection = new PeerCollection( $('#viewport') );




