import * as _ from 'lodash';

export interface PingResult {
  get: boolean;
  post: boolean;
  cookies: boolean;
  referer: boolean;
  'user-agent': boolean;
  anonymityLevel: 0 | 1;
}

export default function (headers, getParams, postParams, cookies) {
  const res: PingResult = {
    get: (getParams.test && getParams.test == 'get') || false,
    post: (postParams.test && postParams.test == 'post') || false,
    cookies: (cookies.test && cookies.test == 'cookie') || false,
    referer:
      (headers.referer && 'http://www.google.com' == headers.referer) || false,
    'user-agent':
      (headers['user-agent'] && 'Mozilla/4.0' == headers['user-agent']) || false,
      anonymityLevel: 0
  };

  if (getParams.ip) {
    const ips = _.isArray(getParams.ip) ? getParams.ip : [getParams.ip];
    const headersStr = _(headers).reduce((result, el) => result + el);

    const foundIp = _.find(ips, (ip) => headersStr.indexOf(ip) != -1);
    res.anonymityLevel = foundIp ? 0 : 1;
  } else {
    res.anonymityLevel = 0;
  }

  return res;
}
