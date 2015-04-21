#!/usr/bin node

var program = require('commander');

program
  .version('0.0.1')
  .command('vhosts', 'Manage Apache Virtual Hosts')
  .parse(process.argv);
