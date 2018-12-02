'use strict';
var chaiAsPromised = require('chai-as-promised');
var chai = require('chai');
chai.use(chaiAsPromised);
var expect = chai.expect;
var {
  startHttpProxy,
  startHttpOnlyProxy,
  startPingServer,
  startSlowProxy,
  startSocks4Proxy,
  startSocks5Proxy
} = require('./proxy');
var checkProxy = require('../build').check;
var port = {
  http: 8000,
  httpOnly:  8888,
  ping: 8088,
  socks4: 9000,
  socks5: 10000,
  httpSlow: 11000 
}
var localIP = '127.0.0.1';
var localHost = 'localhost';

describe('Check-proxy', function() {
  before(function(done) {
    startHttpProxy(port.http);
    startHttpOnlyProxy(port.httpOnly);
    startSlowProxy(port.httpSlow);
    startSocks4Proxy(port.socks4);
    startSocks5Proxy(port.socks5);
    startPingServer(port.ping);
    setTimeout(done, 3000);
  });

  it('should identify socks5 proxy', function() {
    return checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.socks5,
      localIP: localIP,
      timeout: 1
    })
    .then(function(result) {
      expect(result[0]).to.exist;
      var proxy = result[0];
      expect(proxy.supportsHttps).equal(true);
      expect(proxy.protocol).equal('socks5');
      expect(proxy.ip).equal('127.0.0.1');
      expect(proxy.port).equal(port.socks5);
      expect(proxy.get).equal(true);
      expect(proxy.post).equal(true);
      expect(proxy.cookies).equal(true);
      expect(proxy.referer).equal(true);
      expect(proxy['user-agent']).equal(true);
      expect(proxy.anonymityLevel).equal(1);
      expect(proxy.totalTime).not.null;
      expect(proxy.connectTime).not.null;
      expect(proxy.websites).deep.equal({});
      expect(proxy.country).to.be.null;
    });

  });

  it('should identify http proxy with websites', function() {
    return checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.http,
      localIP: localIP,
      timeout: 2,
      websites: [
        {
          name: 'test1',
          url: 'https://www.example.com',
          regex: /Example Domain/gim,
        },
        {
          name: 'test2',
          url: 'https://www.example.com',
          regex: /Failure/gim,
        },
      ]
    })
    .then(function(result) {
      expect(result[0]).to.exist;
      var proxy = result[0];
      expect(proxy.supportsHttps).equal(true);
      expect(proxy.protocol).equal('http');
      expect(proxy.ip).equal('127.0.0.1');
      expect(proxy.port).equal(port.http);
      expect(proxy.get).equal(true);
      expect(proxy.post).equal(true);
      expect(proxy.cookies).equal(true);
      expect(proxy.referer).equal(true);
      expect(proxy['user-agent']).equal(true);
      expect(proxy.anonymityLevel).equal(1);
      expect(proxy.totalTime).not.null;
      expect(proxy.connectTime).not.null;
      expect(proxy.websites).to.be.an('object');
      expect(proxy.websites.test1).to.be.an('object');
      expect(proxy.websites.test2).equal(false);
      expect(proxy.country).to.be.null;
    });

  });

  it('no https support, no anonymity', function() {
    return checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.httpOnly,
      localIP: localIP,
      timeout: 1
    })
    .then(function(result) {
      expect(result[0]).to.exist;
      var proxy = result[0];
      expect(proxy.supportsHttps).equal(false);
      expect(proxy.protocol).equal('http');
      expect(proxy.ip).equal('127.0.0.1');
      expect(proxy.port).equal(port.httpOnly);
      expect(proxy.get).equal(true);
      expect(proxy.post).equal(true);
      expect(proxy.cookies).equal(true);
      expect(proxy.referer).equal(true);
      expect(proxy['user-agent']).equal(true);
      expect(proxy.anonymityLevel).equal(0);
      expect(proxy.totalTime).not.null;
      expect(proxy.connectTime).not.null;
      expect(proxy.websites).deep.equal({});
      expect(proxy.country).to.be.null;
    });

  });

  it('should identify socks4 proxy', function() {
    return checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.socks4,
      localIP: localIP,
      timeout: 1
    })
    .then(function(result) {
      expect(result[0]).to.exist;
      var proxy = result[0];
      expect(proxy.supportsHttps).equal(true);
      expect(proxy.protocol).equal('socks4');
      expect(proxy.ip).equal('127.0.0.1');
      expect(proxy.port).equal(port.socks4);
      expect(proxy.get).equal(true);
      expect(proxy.post).equal(true);
      expect(proxy.cookies).equal(true);
      expect(proxy.referer).equal(true);
      expect(proxy['user-agent']).equal(true);
      expect(proxy.anonymityLevel).equal(1);
      expect(proxy.totalTime).not.null;
      expect(proxy.connectTime).not.null;
      expect(proxy.websites).deep.equal({});
      expect(proxy.country).to.be.null;
    });

  });

  it('should timeout on slow proxy', function() {
    var promise = checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.httpSlow,
      localIP: localIP,
      timeout: 1
    })
    .then(function(result) {
      expect(result[0]).to.exist;
      var proxy = result[0];
      expect(proxy.supportsHttps).equal(true);
      expect(proxy.protocol).equal('socks4');
      expect(proxy.ip).equal('127.0.0.1');
      expect(proxy.port).equal(port.socks4);
      expect(proxy.get).equal(true);
      expect(proxy.post).equal(true);
      expect(proxy.cookies).equal(true);
      expect(proxy.referer).equal(true);
      expect(proxy['user-agent']).equal(true);
      expect(proxy.anonymityLevel).equal(1);
      expect(proxy.totalTime).not.null;
      expect(proxy.connectTime).not.null;
      expect(proxy.websites).deep.equal({});
      expect(proxy.country).to.be.null;
    });

    return expect(promise).to.eventually.be.rejectedWith(Error);

  });
});
