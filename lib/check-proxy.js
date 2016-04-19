var geoip = require('geoip-ultralight');
var _ = require('lodash');
var extend = require('util')._extend;
var Promise = require('bluebird');
var curlModule = require('curling');
var curl = curlModule.connect();
Promise.promisifyAll(curl);

function pingThroughProxy(url, options) {

  return curl.postAsync(url, options)
    .then(function(result) {
      var proxyData;
      try {

        proxyData = JSON.parse(result.payload || '');
        proxyData.elapsedTime = result.stats.totalTime; // todo: check
        return proxyData;
      } catch (e) {
        return Promise.reject('Unable to parse JSON');
      }
    }, function(err) {

    });
}

function createPingRequestOptions(options, proxyProtocol, websiteProtocol) {
  return {
    url: '"' + websiteProtocol + '://' + options.testHost + '/?test=get&ip=' + options.localIP + '"',
    options: {
      header: [
        'User-Agent: Mozilla/4.0',
        'Accept: text/html',
        'Referer: http://www.google.com',
        'Connection: close'
      ],
      cookie: 'test=cookie;',
      'connect-timeout': '6',
      'max-time': '10',
      'no-keepalive': null,
      k: null, // skip ssl errors
      L: null, // follow location
      //v: null,
      data: ["test=post"],
      proxy: proxyProtocol + '://' + options.proxyIP + ':' + options.proxyPort
    }

  };

}

function testWebsite(url, proxy, regex) {
  var options = {
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Connection: close'
    ],
    'no-keepalive': null,
    //cookie: 'test=cookie;',
    'connect-timeout': '6',
    'max-time': '10',
    k: null, // skip ssl errors
    L: null, // follow location
    //v: null,
    proxy: proxy
  }

  return curl.getAsync('"' + url + '"', options)
    .then(function(html) {
      html = html.payload;
      return regex && regex.test(html) ? true : Promise.reject('data doesn\'t match regex');
    });
}

function testWebsites(proxy, websites) {

  return Promise.map(websites, function(website) {
    return testWebsite(website.url, proxy, website.regex).reflect();
  }, {concurrency : 1})
  .then(function(promises) {

    var result = promises.reduce(function(acc, currentPromise, i) {

      acc[websites[i].name] = currentPromise.isFulfilled();
      return acc;
    }, {});
    return result;
  });
}

var testProtocol = function(proxyProtocol, options) {
  var httpOptions = createPingRequestOptions(options, proxyProtocol, 'http');
  var httpsOptions = createPingRequestOptions(options, proxyProtocol, 'https');
  var promises = [ // test for http and https support simultaneously
    pingThroughProxy(httpOptions.url, httpOptions.options).reflect(),
    pingThroughProxy(httpsOptions.url, httpOptions.options).reflect(),
  ];


  return Promise.all(promises)
    .spread(function(resHttp, resHttps) {

      if (resHttp.isFulfilled()) {

        var proxyData = resHttp.value();
        proxyData.supportsHttps = (resHttps.isFulfilled() === true);
        proxyData.protocol = proxyProtocol;
        proxyData.ip = options.proxyIP;
        proxyData.port = options.proxyPort;

        return testWebsites(httpOptions.options.proxy, options.websites)
          .then(function(websitesResults) {
            proxyData.websites = websitesResults;
            return proxyData;
          });

      } else { // http proxy was rejected, don't check https then
        return Promise.reject(resHttp.reason());
      }
    });

}

function testAllProtocols(options) {
  return Promise.map(['http', /*'https',*/ 'socks4', 'socks5'], function(protocol) {
    return testProtocol(protocol, options).reflect();
  }, {concurrency: 1});

}


module.exports = function(options) {
  var country = geoip.lookupCountry(options.proxyIP);
  options.websites = options.websites || [];

  return testAllProtocols(options)
    .reduce(function(acc, promise) {
      var proxyData;
      if(promise.isFulfilled()) {
        proxyData = promise.value();
        proxyData.country = country;
        acc.push(proxyData);
      }
      return acc;
    }, [])
    .then(function(result) {
      return result.length == 0 ? Promise.reject('proxy checked, invalid') : result;

    });

  

}
