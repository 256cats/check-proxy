var geoip = require('geoip-ultralight');
var _ = require('lodash');
var extend = require('util')._extend;
var Promise = require('bluebird');
var curlModule = require('curling');
var curl = curlModule.connect();
Promise.promisifyAll(curl);

function pingThroughProxy(url, options) {
  //console.log('pingThroughProxy', url, options);
  return curl.postAsync(url, options)
    .then(function(result) {
      var proxyData;
      //console.log('post result', result);
      try {

        proxyData = JSON.parse(result.payload || '');
        proxyData.elapsedTime = result.stats.totalTime; // todo: check
        return proxyData;
      } catch (e) {
        return Promise.reject('Unable to parse JSON');
      }
    }, function(err) {
      //console.log('post err', err)
    });
}
/*
function createRequestOptions(testHost, localIP, protocol) {
  return {
    url: protocol + '://' + testHost + '/?test=get&ip=' + localIP,
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Referer: http://www.google.com',
    ],
    cookie: 'test=cookie;',
    'connect-timeout': '6',
    'max-time': '10',
    k: null, // skip ssl errors
    l: null, // follow location
    data: ["test=post"],
  };

}
*/
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
      //console.log('get async', url, options);
      //console.log(html);
      html = html.payload;
      //console.log('html', html);
      //console.log('check', regex && regex.test(html));
      return regex && regex.test(html) ? true : Promise.reject('data doesn\'t match regex');
    });
}

function testWebsites(proxy, websites) {
  //console.log('proxy', proxy);
  return Promise.map(websites, function(website) {
    return testWebsite(website.url, proxy, website.regex).reflect();
  }, {concurrency : 1})
  .then(function(promises) {
    //console.log('promises1', promises);
    var result = promises.reduce(function(acc, currentPromise, i) {
      //console.log(acc, currentPromise, i);
      acc[websites[i].name] = currentPromise.isFulfilled();
      return acc;
    }, {}); // return {websiteName1: true, websiteName2: false}
    //console.log('result', result);
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

//console.log(httpOptions);
  return Promise.all(promises)
    .spread(function(resHttp, resHttps) {
      //console.log(arguments);
      //process.exit();
      if (resHttp.isFulfilled()) {
        //console.log('fullfilled');
        var proxyData = resHttp.value();
        proxyData.supportsHttps = (resHttps.isFulfilled() === true);
        proxyData.protocol = proxyProtocol;
        proxyData.ip = options.proxyIP;
        proxyData.port = options.proxyPort;

        //return proxyData;

        return testWebsites(httpOptions.options.proxy, options.websites)
          .then(function(websitesResults) {
            //console.log('websites', websitesResults);
            proxyData.websites = websitesResults;
            return proxyData;
          });

      } else { // http proxy was rejected, don't check https then
        //console.log('rejected');
        return Promise.reject(resHttp.reason());
      }
    });

}

function testAllProtocols(options) {
  /*
  return ['socks5'].map(function(protocol) {
    return testProtocol(protocol, options);
  });*/
/*
  return ['http', 'https', 'socks4', 'socks5'].map(function(protocol) {
    return testProtocol(protocol, options);
  });*/

  return Promise.map(['http', /*'https',*/ 'socks4', 'socks5'], function(protocol) {
    return testProtocol(protocol, options).reflect();
  }, {concurrency: 1});

}


module.exports = function(options) {
  var country = geoip.lookupCountry(options.proxyIP);
  options.websites = options.websites || [];

  //var results = [];
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
      //console.log(result);
      return result.length == 0 ? Promise.reject('proxy checked, invalid') : result;

    });

  /*
  return Promise
    .any(testAllProtocols(options)) // we suppose that only 1 protocol works on each ip:port pair, therefore wait only for one of the promises to fulfill
    .then(function(proxyData) {
      proxyData.country = country;
      return proxyData;
    }, function(err) {
      //console.log('all rejected', err);
      return Promise.reject(['proxy checked, invalid', err]);
    });

    */

}
