'use strict';
var Curl = require('node-libcurl').Curl;
var Promise = require('bluebird');
var Multi = require('node-libcurl').Multi;
var querystring = require('querystring');

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
  var multi = new Multi();
  var curl = new Curl();
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

  curl.setOpt('CONNECTTIMEOUT', options.connectTimeout || 6);
  curl.setOpt('TIMEOUT', options.timeout || 10);
  curl.setOpt('WRITEFUNCTION', onData.bind(curl));

  curl.url = url;
  curl.proxy = options.proxy;
  multi.onMessage(onMessage(multi));

  return new Promise(function(resolve, reject) {
    curl.resolve = resolve;
    curl.reject = reject;
    curl.responseData = new Buffer(0);
    curl.ignoreErrors = options.ignoreErrors;
    multi.addHandle(curl);
  });

}

function onMessage(multi) {
  return function (err, handle, errCode) {

    var responseCode = handle.getInfo( 'RESPONSE_CODE' ).data,
      responseData = handle.responseData.toString();
    console.log('>>>', handle.proxy);
    console.log('>>>', responseData);
    if (err) {

      if(handle.ignoreErrors) {
        handle.resolve({
          success: false,
          payload: '',
          stats: {
            responseCode: responseCode,
            connectTime: handle.getInfo('CONNECT_TIME').data,
            totalTime: handle.getInfo('TOTAL_TIME').data,
            receivedLength: handle.getInfo('SIZE_DOWNLOAD').data,
            averageSpeed: handle.getInfo('SPEED_DOWNLOAD').data
          }
        });
      } else {
        handle.reject(err);
      }
      
    } else {

      handle.resolve({
        success: true,
        payload: responseData,
        stats: {
          responseCode: responseCode,
          connectTime: handle.getInfo('CONNECT_TIME').data,
          totalTime: handle.getInfo('TOTAL_TIME').data,
          receivedLength: handle.getInfo('SIZE_DOWNLOAD').data,
          averageSpeed: handle.getInfo('SPEED_DOWNLOAD').data
        }
      })

    }

    handle.close();
    multi.removeHandle(handle);
    multi.close();
  }

}

module.exports.get = get;

