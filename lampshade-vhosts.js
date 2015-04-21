#!/usr/bin node

var sites_available_dir = '/etc/apache2/sites-available';
var sites_enabled_dir = '/etc/apache2/sites-enabled';

var fs        = require('fs');
var program   = require('commander');
var chalk     = require('chalk');
var inquirer  = require('inquirer');
var exec      = require('child_process').exec;

var list      = require('./lib/list');

var vhosts    = list.getVhosts(sites_available_dir, sites_enabled_dir);

function restartApache( callback )
{
  process.stdout.write( "Restarting Apache...\r");
  exec( 'service apache2 reload', function( error, stdout, stderr )
  {
    if( !error ) {
      process.stdout.write( "Restarting Apache... " + chalk.bold.green("Done!") + "\n" );
      if ( typeof callback === 'function' )
        callback();
    } else {
      process.stdout.write( "Restarting Apache... " + chalk.bold.red("Failed:") + "\n" + error );
    }
  });
}

function enableVhost( vhost, callback )
{
  process.stdout.write( "Enabling " + vhost + "... \r");
  exec( 'a2ensite ' + vhost , function( error, stdout, stderr )
  {
    if( !error ) {

      process.stdout.write( "Enabling " + vhost + "... " + chalk.bold.green("Done!") + "\n" );

      restartApache(function() 
      {
        if( typeof callback === 'function')
          callback(vhost);
      });

    } else {

      process.stdout.write( "Enabling " + vhost + "... " + chalk.bold.red("Failed:") + "\n" + error );

    }
  });
}

function disableVhost( vhost )
{
  process.stdout.write( "Disabling " + vhost + "... \r");
  exec( 'a2dissite ' + vhost , function( error, stdout, stderr )
  {
    if( !error ) {

      process.stdout.write( "Disabling " + vhost + "... " + chalk.bold.green("Done!") + "\n" );
      restartApache();

    } else {

      process.stdout.write( "Disabling " + vhost + "... " + chalk.bold.red("Failed:") + "\n" + error );

    }
  });
}

program
  .version('0.0.1')

program
  .command('list')
  .description('List all known virtual hosts')
  .action( function()
  {
    console.log( chalk.bold.underline( "Apache Virtual Hosts (" + chalk.red("Available") + "|" + chalk.green("Enabled") + ")" ) );

    for( var vhost in vhosts ) {
      if( vhosts[vhost] )
        console.log( chalk.bold.red( vhost ) );
      else
        console.log( chalk.bold.green( vhost ) );
    }
  });

program
  .command('create')
  .description('Create a new Apache Virtual Host')
  .action( function()
  {
    inquirer.prompt([
      {
        name: 'serverName',
        message: 'Server Name (without www)'
      },
      {
        type: 'confirm',
        name: 'wwwAlias',
        message: 'Create www alias?',
        default: true
      },
      {
        name: 'documentRoot',
        message: 'Document Root'
      }
    ], function( answers )
    {
      var vhostFile = "<VirtualHost *:80>\n\tServerName " + answers.serverName + "\n\t";

      if( answers.wwwAlias )
        vhostFile += "ServerAlias www." + answers.serverName + "\n\t";

      vhostFile += "DocumentRoot " + answers.documentRoot + "\n\t";
      vhostFile += "ErrorLog ${APACHE_LOG_DIR}/" + answers.serverName + ".error.log\n\t";
      vhostFile += "CustomLog ${APACHE_LOG_DIR}/" + answers.serverName + ".access.log combined\n";
      vhostFile += "</VirtualHost>\n";

      process.stdout.write( "Creating new vhost... \r");
      fs.writeFile(sites_available_dir + "/" + answers.serverName + ".conf", vhostFile, function(err)
      {
        if( err ) {
          process.stdout.write( "Creating new vhost... " + chalk.bold.red("Failed:\n") + err);
        } else {
          process.stdout.write( "Creating new vhost... " + chalk.bold.green("Done!\n"));

          inquirer.prompt({
            type: 'confirm',
            name: 'enable',
            message: 'Would you like to enable this vhost?',
            default: true
          }, function( ans )
          {
            if( ! ans.enable )
              process.exit();

            enableVhost( answers.serverName, function( serverName )
            {
              inquirer.prompt({
                type: 'confirm',
                name: 'addHost',
                message: 'Create /etc/hosts entry for this vhost?',
                default: true
              }, function( ans )
              {
                if( ! ans.addHost )
                  process.exit();

                var entry = "127.0.0.1 " + serverName + "\n";

                process.stdout.write( "Creating /etc/hosts entry... \r");
                fs.appendFile( '/etc/hosts', entry, function( err )
                {
                  if( err ) {
                    process.stdout.write( "Creating /etc/hosts entry... " + chalk.bold.red("Failed:\n") + err);
                  } else {
                    process.stdout.write( "Creating /etc/hosts entry... " + chalk.bold.green("Done!\n"));
                  }
                });
              });
            });

          });
        }
      });

    });
  });

program
  .command('remove')
  .description('Remove an Apache virtual host')
  .action( function()
  {
    console.log("Removed");
  });

program
  .command('enable')
  .description('Enable an existing vhost')
  .action( function()
  {

    inquirer.prompt({
        type: 'list',
        name: 'enable',
        message: 'Which vhost should be enabled?',
        choices: list.getListOfVhostsToEnable( vhosts )
      }, function(answers)
      {
        if( answers.enable == '' )
          process.exit();

        enableVhost( answers.enable );
      });
  });

program
  .command('disable')
  .description('Disable an existing vhost')
  .action( function()
  {
    inquirer.prompt({
        type: 'list',
        name: 'disable',
        message: 'Which vhost should be disabled?',
        choices: list.getListOfVhostsToDisable( vhosts )
      }, function(answers)
      {
        if( answers.disable == '' )
          process.exit();

        disableVhost( answers.disable );
      });
  });

program.parse(process.argv);
