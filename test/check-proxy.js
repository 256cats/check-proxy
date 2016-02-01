var Promise = require('bluebird');
var curlModule = require('curling');
var assert = require('assert');
var sinon = require('sinon');
var curl = curlModule.connect();
sinon.stub(curlModule, 'connect').returns(curl); // stub it, so connect() always returns the same instance
var checkProxy = require('../index.js').check;
//Promise.promisifyAll(curl);

//console.log('called1', curlModule.connect.callCount);


var exampleProxy = '201.173.226.94', examplePort = 10000, examplePingServer = 'pingserver.com', localIP = '192.168.1.1';

function generateProxyRequestOptions(protocol) {
  return {
      header: [
        'User-Agent: Mozilla/4.0',
        'Accept: text/html',
        'Referer: http://www.google.com',
        'Connection: close'
      ],
      'no-keepalive': null,
      cookie: 'test=cookie;',
      'connect-timeout': '6',
      'max-time': '10',
      k: null, // skip ssl errors
      L: null, // follow location
      data: ["test=post"],
      proxy: protocol + '://' + exampleProxy + ':' + examplePort
    }
}

function generateWebsiteRequestOptions(protocol) {
  return {
      header: [
        'User-Agent: Mozilla/4.0',
        'Accept: text/html',
        'Connection: close'

      ],
      'no-keepalive': null,
      //cookie: 'test=cookie;',
      'connect-timeout': '6',
      k: null, // skip ssl errors
      L: null, // follow location
      'max-time': '10',
      proxy: protocol + '://' + exampleProxy + ':' + examplePort
    }
}

function generateStubs(post, get, workingProtocol, https, websites) {
  workingProtocol = workingProtocol.constructor === Array ? workingProtocol : [workingProtocol];
  websites = websites || [];
  https = https || false;

  var options, url = examplePingServer + '/?test=get&ip=' + localIP;

  var curlResult = {
    payload : JSON.stringify({"get":true,"post":true,"cookies":true,"referer":true,"user-agent":true,"anonymityLevel":1}),
    stats : {totalTime : 1000}
  };
  ['http', 'https', 'socks4', 'socks5']
  //['socks5']
  .forEach(function(protocol) {
    options = generateProxyRequestOptions(protocol);

    //stub post http post request
    //console.log('"http://' + url + '"', options);

    post
      .withArgs('"http://' + url + '"', options)
      .yields(null,
          //protocol ===  workingProtocol ? // if this is working protocol
          workingProtocol.indexOf(protocol) !== -1 ? // if this is working protocol
          curlResult // return real JSON
          : '<html>proxy is not available</html>' // otherwise return html which won't be parsed
      );

    //stub post https post request
    //console.log('https', protocol ===  workingProtocol && https);
    post
      .withArgs('"https://' + url + '"', options)
      .yields(null,
          workingProtocol.indexOf(protocol) !== -1 && https ? // if this is working protocol & https should be working
          //protocol ===  workingProtocol && https ? // if this is working protocol & https should be working
          curlResult // return real JSON
          : '<html>proxy is not available</html>' // otherwise return html which won't be parsed
      );

    //stub get requests for websites
    websites.forEach(function(w) {
      //console.log('get stub', w.url, generateWebsiteRequestOptions(protocol));
      var websiteCurlResult = {
        payload : w.result,
        stats : {totalTime : 1000}
      };
      get
        .withArgs('"' + w.url + '"', generateWebsiteRequestOptions(protocol))
        .yields(null, websiteCurlResult) // each website passes desired result
    });
  })

}

describe('Check-proxy', function(){

  beforeEach(function() {
    this.get = sinon.stub(curl, 'get');
    this.post = sinon.stub(curl, 'post');

  });

  afterEach(function() {
    curl.get.restore();
    curl.post.restore();
    //curlModule.connect.restore();
  });

  it('should return socks5 proxy with https support, no websites', function() {

    generateStubs(this.post, this.get, 'socks5', true);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 25000,
      //websites: exampleWebsites
    })
    .then(function(result) {
      //console.log('check result', result);
      //console.log('post call count', curl.post.callCount);
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        elapsedTime: 1000,
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
    generateStubs(this.post, this.get, 'socks4', false, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 25000,
      websites: testWebsites
    })
    .then(function(result) {
      //console.log('check result', result);
      //console.log('post call count', curl.post.callCount);
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        elapsedTime: 1000,
        supportsHttps: false,
        protocol: 'socks4',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: true,
          test2: true,
          test3: false,
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
    generateStubs(this.post, this.get, ['socks4', 'socks5'], false, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 25000,
      websites: testWebsites
    })
    .then(function(result) {
      //console.log('check result', result);
      //console.log('post call count', curl.post.callCount);
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        elapsedTime: 1000,
        supportsHttps: false,
        protocol: 'socks4',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: true,
          test2: true,
          test3: false,
        }
      }, {
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        elapsedTime: 1000,
        supportsHttps: false,
        protocol: 'socks5',
        ip: exampleProxy,
        port: examplePort,
        country: 'MX',
        websites: {
          test1: true,
          test2: true,
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
    generateStubs(this.post, this.get, 'http', true, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 25000,
      websites: testWebsites
    })
    .then(function(result) {
      //console.log('check result', result);
      //console.log('post call count', curl.post.callCount);
      assert.deepEqual(result, [{
        get: true,
        post: true,
        cookies: true,
        referer: true,
        'user-agent': true,
        anonymityLevel: 1,
        elapsedTime: 1000,
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
    generateStubs(this.post, this.get, '', true, testWebsites);

    return checkProxy({
      testHost: examplePingServer,
      proxyIP: exampleProxy,
      proxyPort: examplePort,
      localIP: '192.168.1.1',
      timeout: 25000,
      websites: testWebsites
    })
    .then(function(result) {
      //console.log('check result', result);
      //console.log('post call count', curl.post.callCount);
      assert.equal(result,  "proxy checked, invalid");

    }, function(result) {
      assert.equal(result,  "proxy checked, invalid");
    });

  });

  after(function() {
    curlModule.connect.restore();
  });


});
