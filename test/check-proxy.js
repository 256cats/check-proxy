'use strict';
var proxyquire = require('proxyquire');
var Promise = require('bluebird');
var assert = require('assert');
var sinon = require('sinon');
var curl = require('../lib/curl.js');

var proxyQuireStub = {
  '@noCallThru': true,
};
var checkProxy = proxyquire('../lib/check-proxy.js', {
  './curl.js': proxyQuireStub
});

var exampleProxy = '201.173.226.94', examplePort = 10000, examplePingServer = 'pingserver.com', localIP = '192.168.1.1';

function generateProxyRequestOptions(protocol) {
  return {
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Referer: http://www.google.com',
      'Connection: close'
    ],
    cookie: 'test=cookie;',
    data: "test=post",
    timeout: 100,
    connectTimeout: 50,
    proxy: protocol + '://' + exampleProxy + ':' + examplePort,
    //ignoreErrors: true
  }
}

function generateWebsiteRequestOptions(protocol) {
  return {
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Connection: close'
    ],
    proxy: protocol + '://' + exampleProxy + ':' + examplePort,
    ignoreErrors: true
  }
}

function generateStubs(curlGetStub, workingProtocol, https, websites) {
  workingProtocol = workingProtocol.constructor === Array ? workingProtocol : [workingProtocol];
  websites = websites || [];
  https = https || false;

  var options, url = examplePingServer + '/?test=get&ip=' + localIP;

  var curlResult = {
    payload : JSON.stringify({"get":true,"post":true,"cookies":true,"referer":true,"user-agent":true,"anonymityLevel":1}),
    stats : {totalTime : 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000}
  };

  var curlEmptyResult = {
    payload : '<html>proxy is not available</html>',
    stats : {totalTime : 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000}
  };

  ['http', 'https', 'socks4', 'socks5'].forEach(function(protocol) {
    options = generateProxyRequestOptions(protocol);

    //stub post http post request
    curlGetStub
      .withArgs('http://' + url, options)
      .returns(Promise.resolve(
          workingProtocol.indexOf(protocol) !== -1 ? // if this is working protocol
            curlResult // return real JSON
            : curlEmptyResult // otherwise return html which won't be parsed
      ));

    curlGetStub
      .withArgs('https://' + url, options)
      .returns(Promise.resolve(
          workingProtocol.indexOf(protocol) !== -1 && https ? // if this is working protocol & https should be working
            curlResult // return real JSON
            : curlEmptyResult // otherwise return html which won't be parsed
      ));

    //stub get requests for websites
    websites.forEach(function(w) {
      var websiteCurlResult = {
        payload : w.result,
        stats : {totalTime : 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000}
      };

      var options = generateWebsiteRequestOptions(protocol);
      curlGetStub
        .withArgs(w.url, options)
        .returns(Promise.resolve(websiteCurlResult)) // each website passes desired result
    });
  })

}

describe('Check-proxy', function(){

  beforeEach(function() {
    this.get = proxyQuireStub.get = sinon.stub(curl, 'get');
  });

  afterEach(function() {
    curl.get.restore();
  });

  it('should return socks5 proxy with https support, no websites', function() {

    generateStubs(this.get, 'socks5', true);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 100,
      connectTimeout: 50

    })
    .then(function(result) {

      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        totalTime: 1000,
        connectTime: 1000,
        supportsHttps: true,
        protocol: 'socks5',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {}
      }]);

    });

  });


  it('should return socks4 proxy without https support, "test1", "test2" websites working, "test3" not working', function() {
    var testWebsites = [
      {
        name: 'test1',
        url: 'http://www.example.com',
        regex: /ok/, // expected result
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test2',
        url: 'http://www.yandex.ru',
        regex: /ok/, // expected result
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test3',
        url: 'http://www.notok.com',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      }
    ];
    generateStubs(this.get, 'socks4', false, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 100,
      connectTimeout: 50,
      websites: testWebsites
    })
    .then(function(result) {
      
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        totalTime: 1000,
        connectTime: 1000,
        supportsHttps: false,
        protocol: 'socks4',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test2: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test3: false,
        }
      }]);

    });

  });

  it('should return socks4 proxy without https support, "test1", "test2" websites working, "test3" working, "test4",test5 not working, one regex, one function, one substring search, one regex not set', function() {
    var testWebsites = [
      {
        name: 'test1',
        url: 'http://www.example.com',
        regex: /ok/, // expected result - regex
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test2',
        url: 'http://www.yandex.ru',
        regex: function(html) { // expected result - function
          return html.indexOf('ok') != -1
        },
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test3',
        url: 'http://www.notok.com',
        regex: 'ok', // expected result- string
        result: 'no okdata' // result to be provided by stub
      },
      {
        name: 'test4',
        url: 'http://www.notok.com',

        result: 'no okdata' // result to be provided by stub
      },
      {
        name: 'test5',
        url: 'http://www.notok.com',
        regex: 'substring',
        result: 'no okdata' // result to be provided by stub
      }
    ];
    generateStubs(this.get, 'socks4', false, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 100,
      connectTimeout: 50,
      websites: testWebsites
    })
    .then(function(result) {
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        totalTime: 1000,
        connectTime: 1000,
        supportsHttps: false,
        protocol: 'socks4',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test2: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test3: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test4: false,
          test5: false
        }
      }]);

    });

  });


  it('should return array with socks4 and socks5 proxies without https support, "test1", "test2" websites working, "test3" not working', function() {
    var testWebsites = [
      {
        name: 'test1',
        url: 'http://www.example.com',
        regex: /ok/, // expected result
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test2',
        url: 'http://www.yandex.ru',
        regex: /ok/, // expected result
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test3',
        url: 'http://www.notok.com',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      }
    ];
    generateStubs(this.get, ['socks4', 'socks5'], false, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 100,
      connectTimeout: 50,
      websites: testWebsites
    })
    .then(function(result) {

      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        totalTime: 1000,
        connectTime: 1000,
        supportsHttps: false,
        protocol: 'socks4',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test2: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test3: false,
        }
      }, {
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        totalTime: 1000,
        connectTime: 1000,
        supportsHttps: false,
        protocol: 'socks5',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test2: {"totalTime": 1000, connectTime: 1000, responseCode: 200, receivedLength: 1000},
          test3: false,
        }
      }]);

    });

  });

  it('should return http proxy with https support, all websites not working', function() {
    var testWebsites = [
      {
        name: 'test1',
        url: 'http://www.example.com',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      },
      {
        name: 'test2',
        url: 'http://www.yandex.ru',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      },
      {
        name: 'test3',
        url: 'http://www.notok.com',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      }
    ];
    generateStubs(this.get, 'http', true, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 100,
      connectTimeout: 50,
      websites: testWebsites
    })
    .then(function(result) {
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        totalTime: 1000,
        connectTime: 1000,
        supportsHttps: true,
        protocol: 'http',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: false,
          test2: false,
          test3: false,
        }
      }]);

    });

  });

  it('should return rejected promise when no protocols are working', function() {
    var testWebsites = [
      {
        name: 'test1',
        url: 'http://www.example.com',
        regex: /ok/, // expected result
        result: 'ok' // result to be provided by stub
      },
      {
        name: 'test2',
        url: 'http://www.yandex.ru',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      },
      {
        name: 'test3',
        url: 'http://www.notok.com',
        regex: /ok/, // expected result
        result: 'no data' // result to be provided by stub
      }
    ];
    generateStubs(this.get, '', true, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 100,
      connectTimeout: 50,
      websites: testWebsites
    })
    .then(function(result) {
      assert.equal(result,  "proxy checked, invalid");
    }, function(result) {
      assert.equal(result,  "proxy checked, invalid");
    });

  });

});
