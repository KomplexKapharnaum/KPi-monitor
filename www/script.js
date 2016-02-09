
function PeerCollection() {
    var that = this;
    this.peers = {};

    this.addPeers = function(peers) {
      for(p of peers) this.add(p);
    }

    this.add = function(url) {
      var name = url.replace(':','-');
      if (this.peers[name]) return;
      this.peers[name] = new Peer(name, 'http://'+url);
      $('#viewport').append(this.peers[name].dom);

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
          console.info('catching back webserver');
          peerCollection.addPeers(peers);
        }
        else {
          that.socket.disconnect();
          console.info('dropping webserver');
        }
      });
    }

    this.starter();
}

function Peer(name, url) {
  var that = this;

  this.name = name;
  this.url = url;
  this.io = {};
  this.isalive = false;

  this.dom = $('<div id="'+name+'">Peer '+name+
                              ': <span style="display:none"> Relais: '
                              +'<button class="play">ON</button>'
                              +'<button class="stop">OFF</button>'
                              +'</span></div>');
  
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
  this.io['execute'].on('do', function(data) { console.info(data); });
  this.io['execute'].on('did', function(data) { console.info(data); });

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
    console.info('STATUS '+JSON.stringify(message.data));
    if (message.data.peers.length > 0)
      peerCollection.addPeers(message.data.peers);
  });
  this.io['inform'].on('/newclient', function(message) {
    peerCollection.addPeers([message.data]);
  });
  this.io['inform'].on('/newserver', function(message) {
    peerCollection.addPeers([message.data]);
  });
  this.io['inform'].on('disconnect', function() {
    //console.info('Peer disconnected: '+that.url);
    that.isalive = false;
    that.onStateChange(that);
  });

  this.onStateChange = function(el) {};
  this.alive = function() {return that.isalive;};
}

var peerCollection = new PeerCollection( $('#viewport') );




