#!/bin/env node
// Based on OpenShift sample Node application - https://github.com/openshift/origin-server
const express = require('express'),
  app = express(),
  url = require('url'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  getProxyType = require('check-proxy').ping;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const ping = function (req, res) {
  console.log('ip', req.connection.remoteAddress);
  console.log('headers', req.headers);
  console.log('cookies', req.cookies);
  res.json(getProxyType(req.headers, req.query, req.body, req.cookies));
};

app.get('/', ping);
app.post('/', ping);

const ipaddress = process.env.OPENSHIFT_NODEJS_IP;
const port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

if (typeof ipaddress === 'undefined') {
  //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
  //  allows us to run/test the app locally.
  console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
  ipaddress = '127.0.0.1';
}

const terminator = function (sig) {
  if (typeof sig === 'string') {
    console.log(
      '%s: Received %s - terminating sample app ...',
      Date(Date.now()),
      sig
    );
    process.exit(1);
  }
  console.log('%s: Node server stopped.', Date(Date.now()));
};

//  Process on exit and signals.
process.on('exit', function () {
  terminator();
});

// Removed 'SIGPIPE' from the list - bugz 852598.
[
  'SIGHUP',
  'SIGINT',
  'SIGQUIT',
  'SIGILL',
  'SIGTRAP',
  'SIGABRT',
  'SIGBUS',
  'SIGFPE',
  'SIGUSR1',
  'SIGSEGV',
  'SIGUSR2',
  'SIGTERM'
].forEach(function (element, index, array) {
  process.on(element, function () {
    terminator(element);
  });
});
//app.enable('trust proxy');

app.listen(port, ipaddress, function () {
  console.log(
    '%s: Node server started on %s:%d ...',
    Date(Date.now()),
    ipaddress,
    port
  );
});
