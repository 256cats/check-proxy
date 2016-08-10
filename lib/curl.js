'use strict';
var Curl = require('node-libcurl').Curl;
var Easy = require('node-libcurl').Easy;
var Multi = require('node-libcurl').Multi;
var Promise = require('bluebird');
var querystring = require('querystring');

var multi = new Multi();


/**
 * @param {Buffer} data
 * @param {Number} n
 * @param {Number} nmemb
 * @returns {number}
 */
function onData( data, n, nmemb ) {
    this.responseData = this.responseData ? Buffer.concat([this.responseData, data]) : data;
    return n * nmemb;
}

function get(url, options) {

  var curl = new Easy();
  curl.setOpt('URL', url);
 
  if(options.header) {
    curl.setOpt('HTTPHEADER', options.header);
  }

  if(options.cookie) {
    curl.setOpt('COOKIE', options.cookie);
  }

  curl.setOpt('FOLLOWLOCATION', true);
  curl.setOpt('HEADER', false);
  curl.setOpt('FORBID_REUSE', true);

  curl.setOpt('AUTOREFERER', true);
  curl.setOpt('SSL_VERIFYHOST', false);
  curl.setOpt('SSL_VERIFYPEER', false);
  if(options.proxy) {
    curl.setOpt('PROXY', options.proxy);
   
  }
  if(options.data) {
    curl.setOpt('POSTFIELDS', options.data);
  }

  curl.url = url;
  curl.proxy = options.proxy;
  curl.setOpt('CONNECTTIMEOUT', options.connectTimeout || 6);
  curl.setOpt('TIMEOUT', options.timeout || 10); 
  curl.setOpt( 'WRITEFUNCTION', onData );
  //curl.setOpt('USERAGENT', 'Mozilla/5.0 (Windows; U; Windows NT 5.0; en; rv:1.9.0.4) Gecko/2009011913 Firefox/3.0.6');
  return new Promise(function(resolve, reject) {
    curl.resolve = resolve;
    curl.reject = reject;
    curl.responseData = new Buffer(0);
    curl.ignoreErrors = options.ignoreErrors;
    multi.addHandle(curl);

  });

}

module.exports.get = get;


multi.onMessage(function(err, handle, errCode) {

  var responseCode = handle.getInfo( 'RESPONSE_CODE' ).data,
    responseData = handle.responseData.toString();

  if (err) {

    if(handle.ignoreErrors) {
      handle.resolve({
        success:false,
        payload: '',
        stats: {
          responseCode: responseCode,
          connectTime: handle.getInfo('CONNECT_TIME').data,
          totalTime: handle.getInfo('TOTAL_TIME').data,
          receivedLength: handle.responseData.length}
      });
    } else {
      handle.reject(err);
    }
    
  } else {

    handle.resolve({
      success:true,
      payload: responseData,
      stats: {
        responseCode: responseCode,
        connectTime: handle.getInfo('CONNECT_TIME').data,
        totalTime: handle.getInfo('TOTAL_TIME').data,
        receivedLength: handle.responseData.length
      }
    })

  }

  multi.removeHandle( handle );
  handle.close();

});
