'use strict';
const assert = require('assert');
const ping = require('../build/index').ping;

describe('Ping', function () {
  it('should return all false', function () {
    const expected = {
      get: false,
      post: false,
      cookies: false,
      referer: false,
      'user-agent': false,
      anonymityLevel: 0
    };

    const result = ping(
      {
        proxy: '127.0.0.1',
        proxy_via: '127.1.1.1',
        referer: '',
        'user-agent': ''
      },
      {
        test: 'wrong',
        ip: ['127.0.0.1', '127.1.1.1', '192.167.1.4']
      },
      {
        test: 'wrong'
      },
      {
        test: 'wrong'
      }
    );

    assert.deepEqual(result, expected);
  });

  it('should return all true', function () {
    const expected = {
      get: true,
      post: true,
      cookies: true,
      referer: true,
      'user-agent': true,
      anonymityLevel: 1
    };
    const result = ping(
      {
        proxy: '127.0.0.1',
        proxy_via: '127.1.1.1',
        referer: 'http://www.google.com',
        'user-agent': 'Mozilla/4.0'
      },
      {
        test: 'get',
        ip: '192.167.1.4'
      },
      {
        test: 'post'
      },
      {
        test: 'cookie'
      }
    );
    assert.deepEqual(result, expected);
  });

  it('accepts single IP string and array of IP addresses', function () {
    let expected = {
      get: false,
      post: true,
      cookies: true,
      referer: true,
      'user-agent': true,
      anonymityLevel: 0
    };
    let result = ping(
      {
        proxy: '127.0.0.1',
        proxy_via: '127.1.1.1',
        proxy_via2: '192.167.1.4',
        referer: 'http://www.google.com',
        'user-agent': 'Mozilla/4.0'
      },
      {
        ip: '192.167.1.4'
      },
      {
        test: 'post'
      },
      {
        test: 'cookie'
      }
    );
    assert.deepEqual(result, expected);

    expected = {
      get: false,
      post: true,
      cookies: true,
      referer: true,
      'user-agent': true,
      anonymityLevel: 0
    };
    result = ping(
      {
        proxy: '127.0.0.1',
        proxy_via: '127.1.1.1',
        proxy_via2: '192.167.1.4',
        referer: 'http://www.google.com',
        'user-agent': 'Mozilla/4.0'
      },
      {
        ip: ['192.167.1.4', '192.168.99.1']
      },
      {
        test: 'post'
      },
      {
        test: 'cookie'
      }
    );
    assert.deepEqual(result, expected);
  });
});
