var fs        = require('fs');
var chalk     = require('chalk');
var inquirer  = require('inquirer');

var vhosts = [];

module.exports = {
  getVhosts: function( availableDir, enabledDir )
  {
    var fileList = fs.readdirSync( availableDir );
    var vhosts = [];

    for( var file in fileList ) {
      var noExt = fileList[file].replace(/\.[^/.]+$/, ""); // remove file extension
      var enabled = fs.existsSync(enabledDir + '/' + fileList[file]);

      vhosts.push({
        name: chalk.bold(noExt),
        value: noExt,
        enabled: enabled,
      });
    }

    return vhosts;
  },

  getListOfVhostsToEnable: function( vhosts )
  {
    var result = [];

    for( var vhost in vhosts )
      if( ! vhosts[vhost].enabled )
        result.push( vhosts[vhost] );

    result.push( new inquirer.Separator() );
    result.push( {name: chalk.bold("Cancel"), value: ""} );

    return result;
  },

  getListOfVhostsToDisable: function( vhosts )
  {
    var result = [];

    for( var vhost in vhosts )
      if( vhosts[vhost].enabled )
        result.push( vhosts[vhost] );

    result.push( new inquirer.Separator() );
    result.push( {name: chalk.bold("Cancel"), value: ""} );

    return result;
  }
};
