'use strict';
var _  = require('lodash');

function find(collection, items) {
  return _.find(items, function(el) {
    return typeof collection[el] !== 'undefined';
  })
}

module.exports = function(headers, getParams, postParams, cookies) {
	var res = {
		get: (getParams.test && getParams.test == 'get') || false,
		post: (postParams.test && postParams.test == 'post') || false,
		cookies: (cookies.test && cookies.test == 'cookie') || false,
		referer: (headers.referer && 'http://www.google.com' == headers.referer) || false,
		'user-agent': (headers['user-agent'] && 'Mozilla/4.0' == headers['user-agent']) || false,
	};

  if(getParams.ip) {
    var ips = getParams.ip.constructor === Array ? getParams.ip : [getParams.ip];
    var headersStr = _(headers).reduce(function (result, el) {
      return result + el;
    });

    var foundIp = _.find(ips, function(ip) {
      return headersStr.indexOf(ip) != -1;
    });
    res.anonymityLevel = foundIp ? 0 : 1;

  } else {
    res.anonymityLevel = 0;
  }

	return res;
}
