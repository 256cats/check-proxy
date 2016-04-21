var checkProxy = require('check-proxy').check;
checkProxy({
	testHost: 'ping.rhcloud.com', // put your ping app url here
	proxyIP: '107.151.152.218', // proxy ip to test
  proxyPort: 80, // proxy port to test
  localIP: '185.103.27.23', // local machine ip to test
  connectTimeout: 6, // curl connect timeout, sec
  timeout: 10, // curl timeout, sec
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
      regex: function(html) { // expected result - custom function
        return html && html.indexOf('google') != -1;
      },
    },
    {
      name: 'amazon',
      url: 'http://www.amazon.com/',
      regex: 'Amazon', // expected result - look for this string in the output
    },

  ]
}).then(function(res) {
	console.log('final result', res);
}, function(err) {
  console.log('proxy rejected', err);
});
