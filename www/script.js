
function PeerCollection() {

    this.peers = {};

    this.addPeers = function(peers) {
      for(n in peers) this.add(n, peers[n]);
    }

    this.add = function(name, url) {
      if (this.peers[name]) return;
      this.peers[name] = new Peer(url);
      this.update();
    }

    this.update = function() {

    }

    this.size = function() {
      return Object.keys(this.peers).length;
    }
}

function Peer(url) {
  var that = this;

  this.url = url;
  this.io = {};

  // Open EXECUTE channel
  this.io['execute'] = io.connect(url+'/execute');
  this.io['execute'].on('connect', function(){
      that.io['execute'].emit('iam', {peerid: 'interface'});
  });
  this.io['execute'].on('do', function(data) { console.info(data); });
  this.io['execute'].on('did', function(data) { console.info(data); });

  // Open INFORM channel
  this.io['inform'] = io.connect(url+'/inform');
  this.io['inform'].on('connect', function(){
      that.io['inform'].emit('iam', {peerid: 'interface'});
  });
  this.io['inform'].on('status', function(data) {
    peerCollection.addPeers(data.peers);
  });
  this.io['inform'].on('newpeer', function(data) {
    peerCollection.addPeers(data);
  });
}

var peerCollection = new PeerCollection();

var socket = io.connect();
socket.on('peers', function (data) {
  peerCollection.addPeers(data);
  //if (peerCollection.size() > 0) {socket.disconnect();}
});
