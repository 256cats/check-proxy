'use strict';
var assert = require('assert');
var sinon = require('sinon');
var ping = require('../index.js').ping;

describe('Ping', function(){
  it('should return all false', function(){
    var expected = {"get":false,"post":false,"cookies":false,"referer":false,"user-agent":false,"anonymityLevel":0};

    var result = ping(
      {
        proxy : '127.0.0.1',
        proxy_via : '127.1.1.1',
        referer : '',
        'user-agent' : ''
      },
      {
        test : 'wrong',
        ip : ['127.0.0.1', '127.1.1.1', '192.167.1.4']
      },
      {
        test : 'wrong'
      },
      {
        test : 'wrong'
      }
    );

    assert.deepEqual(result, expected);

  });

  it('should return all true', function(){
    var expected = {"get":true,"post":true,"cookies":true,"referer":true,"user-agent":true,"anonymityLevel":1};
    var result = ping({
        proxy : '127.0.0.1',
        proxy_via : '127.1.1.1',
        referer : 'http://www.google.com',
        'user-agent' : 'Mozilla/4.0'
      },
      {
        test : 'get',
        ip : '192.167.1.4'
      },
      {
        test : 'post'
      },
      {
        test : 'cookie'
      });
    assert.deepEqual(result, expected);

  });

  it('accepts single IP string and array of IP addresses', function(){
    var expected = {"get":false,"post":true,"cookies":true,"referer":true,"user-agent":true,"anonymityLevel":0};
    var result = ping({
        proxy : '127.0.0.1',
        proxy_via : '127.1.1.1',
        proxy_via2 : '192.167.1.4',
        referer : 'http://www.google.com',
        'user-agent' : 'Mozilla/4.0'
      },
      {

        ip : '192.167.1.4'
      },
      {
        test : 'post'
      },
      {
        test : 'cookie'
      });
    assert.deepEqual(result, expected);


    expected = {"get":false,"post":true,"cookies":true,"referer":true,"user-agent":true,"anonymityLevel":0};
    var result = ping({
        proxy : '127.0.0.1',
        proxy_via : '127.1.1.1',
        proxy_via2 : '192.167.1.4',
        referer : 'http://www.google.com',
        'user-agent' : 'Mozilla/4.0'
      },
      {

        ip : ['192.167.1.4', '192.168.99.1']
      },
      {
        test : 'post'
      },
      {
        test : 'cookie'
      });
    assert.deepEqual(result, expected);

  });
});
