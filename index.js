'use strict'
var ping = require('./lib/ping'),
  check = require('./lib/check-proxy');

module.exports = {
  ping: ping,
  check: check
}
