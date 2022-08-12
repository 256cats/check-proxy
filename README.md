[![Build Status](https://travis-ci.org/256cats/check-proxy.svg?branch=master)](https://travis-ci.org/256cats/check-proxy)
# Check-proxy - Advanced Node proxy testing library

This is an advanced proxy checking library that powers [https://gimmeproxy.com](https://gimmeproxy.com)

What it does:

 * checks http, socks4 and socks5 proxies
 * performs actual requests, not just pings
 * checks GET, POST, COOKIES, referer support
 * checks https support
 * checks country
 * checks proxy speed - provides total time and connect time
 * checks anonymity (binary checks - anonymous or not, 1 - anonymous, i.e. doesn't leak your IP address in any of the headers, 0 - not anonymous)
 * checks if proxy supports particular websites - by custom function, regex or substring search
 * allows to set connect timeout and overall timeout

It will return a promise that is either fulfilled with an array of working proxies and protocols (some proxies support SOCKS4/SOCKS5 on the same port) or rejected if it wasn't able to connect to provided port.

## Installation

````javascript
  npm install check-proxy --save
  yarn add check-proxy
````

## Usage

Library consists of two parts - client and server. Server runs on a known IP address and client tries to connect to server through proxy you provide. 

This allows to reliably check proxy parameters like GET, POST, COOKIES support. See example directory for server app. 

Additionally it's possible to check if particular websites are working through this proxy. Websites are checked against specified function, regex or string.

````javascript

//client.js
const checkProxy = require('check-proxy').check;
checkProxy({
  testHost: 'ping.rhcloud.com', // put your ping server url here
  proxyIP: '107.151.152.218', // proxy ip to test
  proxyPort: 80, // proxy port to test
  localIP: '185.103.27.23', // local machine IP address to test
  connectTimeout: 6, // curl connect timeout, sec
  timeout: 10, // curl timeout, sec
  websites: [
    {
      name: 'example',
      url: 'http://www.example.com/',
      regex: /example/gim, // expected result - regex

    },
    {
      name: 'yandex',
      url: 'http://www.yandex.ru/',
      regex: /yandex/gim, // expected result - regex

    },
    {
      name: 'google',
      url: 'http://www.google.com/',
      regex: function(html) { // expected result - custom function
        return html && html.indexOf('google') != -1;
      },
    },
    {
      name: 'amazon',
      url: 'http://www.amazon.com/',
      regex: 'Amazon', // expected result - look for this string in the output
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
  port: 80,
  country: 'MX',
  connectTime: 0.23, // Time in seconds it took to establish the connection
  totalTime: 1.1, // Total transaction time in seconds for last the transfer
  websites: {
    example: {
      "responseCode": 200,
      "connectTime": 0.648131, // seconds
      "totalTime": 0.890804, // seconds
      "receivedLength": 1270, // bytes
      "averageSpeed": 1425 // bytes per second
    },
    google: {
      "responseCode": 200,
      "connectTime": 0.648131, // seconds
      "totalTime": 0.890804, // seconds
      "receivedLength": 1270, // bytes
      "averageSpeed": 1425 // bytes per second
    },
    amazon: false,
    yandex: false
  }
}]
*/

````

````javascript
//server.js
const express = require('express'),
  app = express(),
  url = require('url'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  getProxyType = require('check-proxy').ping;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const ping = function(req, res) {
  console.log('ip', req.connection.remoteAddress);
  console.log('headers', req.headers);
	console.log('cookies', req.cookies);
  res.json(getProxyType(req.headers, req.query, req.body, req.cookies));
}

app.get('/', ping);
app.post('/', ping);

const ipaddress = process.env.OPENSHIFT_NODEJS_IP;
const port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

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

    npm run test

    yarn test

## Changelog

August 2017 - full rewrite in Typescript, readability and speed improvements.

December 2018 - parallel execution of checks, better tests, minimum supported Node version is 8.

August 2022 - removed http checks.
