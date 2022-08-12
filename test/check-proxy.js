'use strict';
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
chai.use(chaiAsPromised);
const expect = chai.expect;
const {
  startHttpProxy,
  startHttpOnlyProxy,
  startPingServer,
  startSlowProxy,
  startSocks4Proxy,
  startSocks5Proxy
} = require('./proxy');
const checkProxy = require('../build').check;
const port = {
  http: 8000,
  httpOnly: 8888,
  ping: 8088,
  socks4: 9000,
  socks5: 10000,
  httpSlow: 11000
};
const localIP = '127.0.0.1';
const localHost = 'localhost';

describe('Check-proxy', function () {
  before(function (done) {
    startHttpProxy(port.http);
    startHttpOnlyProxy(port.httpOnly);
    startSlowProxy(port.httpSlow);
    startSocks4Proxy(port.socks4);
    startSocks5Proxy(port.socks5);
    startPingServer(port.ping);
    setTimeout(done, 3000);
  });

  it('should identify socks5 proxy', function () {
    return checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.socks5,
      localIP: localIP,
      timeout: 1
    }).then(function (result) {
      expect(result[0]).to.exist;
      const proxy = result[0];
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

  it('should identify http proxy with websites', function () {
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
          regex: /Example Domain/gim
        },
        {
          name: 'test2',
          url: 'https://www.example.com',
          regex: /Failure/gim
        }
      ]
    }).then(function (result) {
      expect(result[0]).to.exist;
      const proxy = result[0];
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

  it('no https support, no anonymity', function () {
    const promise = checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.httpOnly,
      localIP: localIP,
      timeout: 1
    });

    expect(promise).to.eventually.be.rejectedWith(Error);
  });

  it('should identify socks4 proxy', function () {
    return checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.socks4,
      localIP: localIP,
      timeout: 1
    }).then(function (result) {
      expect(result[0]).to.exist;
      const proxy = result[0];
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

  it('should timeout on slow proxy', function () {
    const promise = checkProxy({
      testHost: localHost + ':' + port.ping,
      proxyIP: localIP,
      proxyPort: port.httpSlow,
      localIP: localIP,
      timeout: 1
    }).then(function (result) {
      expect(result[0]).to.exist;
      const proxy = result[0];
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
