
function PeerCollection() {

    this.peers = {};

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
  this.io['inform'].on('status', function(data) { console.info(data); });
}

var peerCollection = new PeerCollection();

var socket = io.connect();
socket.on('peers', function (data) {
  for(n in data) peerCollection.add(n, data[n]);
  if (peerCollection.size() > 0) {socket.disconnect();}
});
