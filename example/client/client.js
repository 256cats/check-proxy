var checkProxy = require('../../index').check;
checkProxy({
	testHost: 'ping.rhcloud.com', // put your ping server url here
	proxyIP: '107.151.152.218', // proxy ip to test
  proxyPort: 80, // proxy port to test
  localIP: '185.103.27.23', // local machine ip to test
  websites: [
    {
      name: 'example',
      url: 'http://www.example.com/',
      regex: /example/gim, // expected result

    },
    {
      name: 'yandex',
      url: 'http://www.yandex.ru/',
      regex: /yandex/gim, // expected result

    },
    {
      name: 'google',
      url: 'http://www.google.com/',
      regex: /google/gim, // expected result
    },
    {
      name: 'amazon',
      url: 'http://www.amazon.com/',
      regex: /amazon/gim, // expected result
    },

  ]
}).then(function(res) {
	console.log('final result', res);
}, function(err) {
  console.log('proxy rejected', err);
});
