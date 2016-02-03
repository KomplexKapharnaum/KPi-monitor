var fs = require('fs');

module.exports = {

  Database: function (basefile) {
    var that = this;

    this.basefile = basefile;

    // Save DB to disk
    this.save = function() {
      fs.writeFileSync(this.basefile, JSON.stringify(this.db));
    }

    // Create/Load DB
    var doSave = false;
    this.db = {phrases: []};
    try { this.db = JSON.parse(fs.readFileSync(this.basefile)); }
    catch (e) {
      this.db = {phrases: []};
      if (e.code === 'ENOENT') this.save();
      else throw e;
    }



  }
}