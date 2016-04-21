[![Build Status](https://travis-ci.org/256cats/check-proxy.svg?branch=master)](https://travis-ci.org/256cats/check-proxy)
[![Coverage Status](https://travis-ci.org/256cats/check-proxy/badge.svg)](https://travis-ci.org/256cats/check-proxy)
# Check-proxy - Advanced Node proxy testing library

This is an advanced proxy checking library. Requires curl.

What it does:
 * checks http, socks4 and socks5 proxies
 * performs actual requests, not just pings
 * checks GET, POST, COOKIES, referer support
 * checks https support
 * checks country
 * checks anonymity (binary checks - anonymous or not)
 * checks if proxy supports particular websites

It will return a promise that is either fulfilled with array of working proxies and protocols (some proxies support SOCKS4/SOCKS5 on the same port) or rejected if it wasn't able to connect on provided port.


## TODO
 * check proxy speed
 * add custom callbacks for website checks

## Installation

  npm install check-proxy --save


## Usage

Library consists of two parts - client and server. This allows to reliably check proxy parameters like GET, POST, COOKIES support. See example directory for OpenShift server app. Websites are checked against specified regex.

````javascript
//client.js
var checkProxy = require('check-proxy').check;
checkProxy({
  testHost: 'ping.rhcloud.com', // put your ping server url here
  proxyIP: '107.151.152.218', // proxy ip to test
  proxyPort: 80, // proxy port to test
  localIP: '185.103.27.23', // local machine IP address to test
  websites: [
    {
      name: 'example',
      url: 'http://www.example.com/',
      regex: /example/gim, // expected result

    },
    {
      name: 'yandex',
      url: 'http://www.yandex.ru/',
      regex: /yandex/gim, // expected result

    },
    {
      name: 'google',
      url: 'http://www.google.com/',
      regex: /google/gim, // expected result
    },
    {
      name: 'amazon',
      url: 'http://www.amazon.com/',
      regex: /amazon/gim, // expected result
    },

  ]
}).then(function(res) {
	console.log('final result', res);
}, function(err) {
  console.log('proxy rejected', err);
});
//result
/*
[{
  get: true,
  post: true,
  cookies: true,
  referer: true,
  'user-agent': true,
  anonymityLevel: 1,
  supportsHttps: true,
  protocol: 'http',
  ip: '107.151.152.218',
  port: '80',
  country: 'MX',
  websites: {
    example: true,
    google: true,
    amazon: true,
    yandex: false
  }
}]
*/

````

````javascript
//server.js
var express = require('express'),
    app = express(),
    url = require('url'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    getProxyType = require('check-proxy').ping;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

var ping = function(req, res) {
  console.log('ip', req.connection.remoteAddress);
  console.log('headers', req.headers);
	console.log('cookies', req.cookies);
  res.json(getProxyType(req.headers, req.query, req.body, req.cookies));
}

app.get('/', ping);
app.post('/', ping);

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

if (typeof ipaddress === "undefined") {
    //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
    //  allows us to run/test the app locally.
    console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
    ipaddress = "127.0.0.1";
};

app.listen(port, ipaddress, function() {
  console.log('%s: Node server started on %s:%d ...',
              Date(Date.now() ), ipaddress, port);
});
````

## Tests

  npm test

## Release History

* 0.0.3 Initial release
