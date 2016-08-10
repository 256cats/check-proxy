'use strict';
var geoip = require('geoip-ultralight');
var _ = require('lodash');
var extend = require('util')._extend;
var Promise = require('bluebird');
var curl = require('./curl.js');
function pingThroughProxy(url, options) {
  
  return curl.get(url, options)
    .then(function(result) {
      var proxyData;
      try {

        proxyData = JSON.parse(result.payload || '');
        proxyData.totalTime = result.stats.totalTime;
        proxyData.connectTime = result.stats.connectTime;
        return proxyData;
      } catch (e) {
        return Promise.reject('Unable to parse JSON');
      }
    }, function(err) {

    });
}

function createPingRequestOptions(options, proxyProtocol, websiteProtocol) {
  return {
    url: websiteProtocol + '://' + options.testHost + '/?test=get&ip=' + options.localIP,
    options: {
      header: [
        'User-Agent: Mozilla/4.0',
        'Accept: text/html',
        'Referer: http://www.google.com',
        'Connection: close'
      ],
      cookie: 'test=cookie;',
      data: "test=post",
      proxy: proxyProtocol + '://' + options.proxyIP + ':' + options.proxyPort,
      timeout: options.timeout,
      connectTimeout: options.connectTimeout
    }

  };

}

function testWebsite(url, proxy, regex, curlOptions) {
  var curlOptions = curlOptions || {};
 
  var options = {
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Connection: close'
    ],
    proxy: proxy,
    ignoreErrors: true
  };
  
  if(curlOptions.connectTimeout) {
    options.connectTimeout = curlOptions.connectTimeout;
  }

  if(curlOptions.timeout) {
    options.timeout = curlOptions.timeout;
  }
 
  return curl.get(url, options)
    .then(function(result) {
      
      var html = result.payload;
      
      if(regex) {
        if(_.isFunction(regex)) { // check as function
          return regex(html, result) ? result.stats : Promise.reject('data doesn\'t match provided function');
        } else if(_.isRegExp(regex)) { // check as regex
          return regex.test(html) ? result.stats : Promise.reject('data doesn\'t match provided regex');
        } else { // check as string
          return html.indexOf(regex) != -1 ? result.stats : Promise.reject('data doesn\'t contain provided string');
        }
      } else {
        return Promise.reject('regex is not set');
      }

      //return regex && regex.test(html) ? true : Promise.reject('data doesn\'t match regex');
    })
}

function testWebsites(proxy, websites) {
  
  return Promise.map(websites, function(website) {
    return testWebsite(website.url, proxy, website.regex, website).reflect();
  }, {concurrency : 1})
  .then(function(promises) {
    var result = promises.reduce(function(acc, currentPromise, i) {
      
      
      acc[websites[i].name] = currentPromise.isFulfilled() ? currentPromise.value() : false;
      return acc;
    }, {});
    
    return result;
  });
}

var testProtocol = function(proxyProtocol, options) {
  var httpOptions = createPingRequestOptions(options, proxyProtocol, 'http');
  var httpsOptions = createPingRequestOptions(options, proxyProtocol, 'https');
  var protocolOptions = [ // test for http and https support simultaneously
    httpOptions,
    httpsOptions
  ];

  return Promise.map(protocolOptions, function(protocolOption) {
    return pingThroughProxy(protocolOption.url, protocolOption.options).reflect()
  }, {concurrency: 1})
  
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
