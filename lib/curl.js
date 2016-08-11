'use strict';
var Curl = require('node-libcurl').Curl;
var Promise = require('bluebird');
var querystring = require('querystring');

function get(url, options) {
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
  
  return new Promise(function(resolve, reject) {
    
    curl.on('end', function( statusCode, body, headers ) {

      resolve({
        success:true,
        payload: body,
        stats: {
          responseCode: this.getInfo('RESPONSE_CODE'),
          connectTime: this.getInfo('CONNECT_TIME'),
          totalTime: this.getInfo('TOTAL_TIME'),
          receivedLength: this.getInfo('SIZE_DOWNLOAD'),
          averageSpeed: this.getInfo('SPEED_DOWNLOAD')
        }
      });
      this.close();
    });

    curl.on('error', function( err ) {

      if(options.ignoreErrors) {

        return resolve({
          success:false,
          payload: '',
          stats: {
            responseCode: curl.getInfo('RESPONSE_CODE'),
            connectTime: curl.getInfo('CONNECT_TIME'),
            totalTime: curl.getInfo('TOTAL_TIME'),
            receivedLength: curl.getInfo('SIZE_DOWNLOAD'),
            averageSpeed: curl.getInfo('SPEED_DOWNLOAD')
          }
        });
      } else {
        reject(err);
      }  
      curl.close.bind(curl)();

    });
    curl.perform();
   
  });

}

module.exports.get = get;

