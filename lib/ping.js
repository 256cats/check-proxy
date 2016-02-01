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

  //var headersStr = _(headers).reduce(function (result, el) {
  //  return result + el;
  //});
  //console.log('headers-string', headersStr);

  if(getParams.ip) {
    var ips = getParams.ip.constructor === Array ? getParams.ip : [getParams.ip];
    //console.log('ips', ips);
    var headersStr = _(headers).reduce(function (result, el) {
      return result + el;
    });
    //console.log('headers-string', headersStr);
    /*var foundIp = _.find(ips, function(ip) {
      return headersStr.indexOf(ip) != -1;
    });*/
    var foundIp = _.find(ips, function(ip) {
      //console.log(ip)
      return headersStr.indexOf(ip) != -1;
    });
    res.anonymityLevel = foundIp ? 0 : 1;

  } else {
    res.anonymityLevel = 0;
  }
  //var ip = getParams.ip || ip;

  /*
	//proxy levels
	//Level 3 Elite Proxy, connection looks like a regular client
	//Level 2 Anonymous Proxy, no ip is forwarded but target site could still tell it's a proxy
	//Level 1 Transparent Proxy, ip is forwarded and target site would be able to tell it's a proxy


	var elite = [
		'x-forwarded-for',
		//'x-forwarded',
		//'via',
		//'proxy-connection',
		'x-real-ip',
		'x-proxy-id',
		'forwarded-for',
		//'forwarded',
		'client-ip',
		'forwarded-for-ip',
		//'x-proxy-connection',
		'coming-from',
		'x-coming-from'
	];

  var anonymous = [
		//'x-forwarded-for',
		'x-forwarded',
		'via',
		'proxy-connection',
		//'x-real-ip',
		//'x-proxy-id',
		//'forwarded-for',
		'forwarded',
		//'client-ip',
		//'forwarded-for-ip',
		'proxy-connection',
		//'coming-from',
		//'x-coming-from'
	];
  var isElite = !find(headers, elite);
  var isAnonymous = !find(headers, anonymous);
	//if(!headers['x-forwarded-for'] && !headers['via'] && !headers['proxy-connection']) {
	if(isElite && isAnonymous) {
		res.type = 3;
	//} else if(!headers['x-forwarded-for']){
	} else if(isAnonymous){
		res.type = 2;
	} else {
		res.type = 1;
	}
  */

	return res;
}
