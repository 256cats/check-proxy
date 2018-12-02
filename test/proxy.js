var http = require('http');
var httpProxy = require('http-proxy');
var socks4 = require('socks4');
var socks5 = require('socksv5');
var express = require('express');
var https = require('https');
var pem = require('pem');
var httpolyglot = require('httpolyglot');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var getProxyType = require('../build/index').ping;
var AnyProxy = require('anyproxy');

function startSocks4Proxy(port) {
  socks4.createServer().listen(port, function() {
    console.log('Socks4 proxy server started', port);
  });
}

function startSocks5Proxy(port) {
  var srv = socks5.createServer(function(info, accept, deny) {
    accept();
  });
  srv.listen(port, function() {
    console.log('Socks5 proxy server started', port);
  });
  srv.useAuth(socks5.auth.None());
}

function startSlowProxy(port) {
  var proxy = httpProxy.createProxyServer();
  http.createServer(function (req, res) {
    setTimeout(function () {
      proxy.web(req, res, { target: req.url });
    }, 5000);
  }).listen(port, function() {
    console.log('Slow proxy server started', port);
  });
}

function startHttpOnlyProxy(port) {
  var proxy = httpProxy.createProxyServer();

  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-Forwarded-For', '127.0.0.1');
  });

  http.createServer(function(req, res) {
    proxy.web(req, res, { target: req.url });
  }).listen(port, function() {
    console.log('Http-only proxy server started', port);
  });
}

function startHttpProxy(port) {
  var options = {
    port: port,
    webInterface: {
      enable: false
    },
    forceProxyHttps: false,
    wsIntercept: false,
    silent: true
  };
  var proxyServer = new AnyProxy.ProxyServer(options);
  proxyServer.on('ready', () => {
    console.log('Http proxy server started', port);
  });
  proxyServer.start();
}

function startPingServer(port) {
  var app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());

  var ping = function(req, res) {
    res.json(getProxyType(req.headers, req.query, req.body, req.cookies));
  }

  app.get('/', ping);
  app.post('/', ping);

  pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
    if (err) {
      throw err;
    }
  
    httpolyglot.createServer({ key: keys.serviceKey, cert: keys.certificate }, app)
      .listen(port, function() {
          console.log('Ping http/https server started', port);
      });
  });
}

module.exports = {
  startHttpProxy,
  startHttpOnlyProxy,
  startPingServer,
  startSlowProxy,
  startSocks4Proxy,
  startSocks5Proxy
}
