import * as geoip from 'geoip-ultralight';
import * as _ from 'lodash';
import * as appendQuery from 'append-query';
import {
  IGetOptions,
  IGetResolveStats,
  ICheckProxyOptions,
  IPingOptions,
  IGetResolve,
  ICheckProxyWebsite,
  ITestWebsitesResult,
  ITestProtocolResult,
  PingThroughProxyFullResult
} from './interfaces.d';
import { EProxyProtocol, EWebsiteProtocol } from './enums';
import request from './request';
import { PingResult } from './ping';

export default async function (
  options: ICheckProxyOptions
): Promise<Array<ITestProtocolResult>> {
  const { abortAllRequests, get } = request();

  async function pingThroughProxy(
    url: string,
    options: IGetOptions
  ): Promise<PingThroughProxyFullResult> {
    try {
      const result = await get(url, options);

      if (!result.success) {
        throw new Error('Request failed');
      }

      const proxyData: PingThroughProxyFullResult = JSON.parse(result.payload || '');
      proxyData.totalTime = result.stats.totalTime;
      proxyData.connectTime = result.stats.connectTime;
      return proxyData;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function createPingRequestOptions(
    options: ICheckProxyOptions,
    proxyProtocol: EProxyProtocol,
    websiteProtocol: EWebsiteProtocol
  ): IPingOptions {
    const url = `${websiteProtocol}://${options.testHost}`;
    return {
      url: appendQuery(url, `test=get&ip=${options.localIP}`),
      options: {
        headers: {
          'User-Agent': 'Mozilla/4.0',
          Accept: 'text/html',
          Referer: 'http://www.google.com',
          Connection: 'close'
        },
        cookie: 'test=cookie;',
        data: { test: 'post' },
        proxy: `${proxyProtocol}://${options.proxyIP}:${options.proxyPort}`,
        timeout: options.timeout || 60,
        connectTimeout: options.connectTimeout
      }
    };
  }

  async function testWebsite(
    url: string,
    proxy: string,
    regex: any,
    website: ICheckProxyWebsite
  ): Promise<IGetResolveStats> {
    const options: IGetOptions = {
      headers: {
        'User-Agent': 'Mozilla/4.0',
        Accept: 'text/html',
        Referer: 'http://www.google.com',
        Connection: 'close'
      },
      proxy,
      ignoreErrors: true
    };

    if (website.connectTimeout) {
      options.connectTimeout = website.connectTimeout;
    }

    if (website.timeout) {
      options.timeout = website.timeout;
    }

    const result = await get(url, options);
    const html = result.payload;

    if (regex) {
      if (_.isFunction(regex)) {
        return regex(html, result)
          ? result.stats
          : Promise.reject(new Error("data doesn't match provided function"));
      } else if (_.isRegExp(regex)) {
        return regex.test(html)
          ? result.stats
          : Promise.reject(new Error("data doesn't match provided regex"));
      } else {
        return html.indexOf(regex) != -1
          ? result.stats
          : Promise.reject(new Error("data doesn't contain provided string"));
      }
    }

    return Promise.reject(new Error('regex is not set'));
  }

  async function testWebsites(
    proxy: string,
    websites: Array<ICheckProxyWebsite>
  ): Promise<ITestWebsitesResult> {
    const result: ITestWebsitesResult = {};
    if (!websites) {
      return result;
    }
    for (let website of websites) {
      try {
        const stats = await testWebsite(
          website.url,
          proxy,
          website.regex,
          website
        );
        result[website.name] = stats;
      } catch (err) {
        result[website.name] = false;
      }
    }
    return result;
  }

  async function testProtocol(
    proxyProtocol: EProxyProtocol,
    options: ICheckProxyOptions
  ): Promise<ITestProtocolResult> {
    let result: ITestProtocolResult;

    const httpsOptions = createPingRequestOptions(
      options,
      proxyProtocol,
      EWebsiteProtocol.https
    );
    const httpsResult = await pingThroughProxy(
      httpsOptions.url,
      httpsOptions.options
    );
    result = Object.assign(
      {
        supportsHttps: true,
        protocol: proxyProtocol,
        ip: options.proxyIP,
        port: options.proxyPort
      },
      httpsResult
    );
    result.websites = await testWebsites(
      httpsOptions.options.proxy,
      options.websites
    );
    return result;
  }

  function testAllProtocols(
    options: ICheckProxyOptions
  ): Promise<Array<ITestProtocolResult>> {
    let resolved = false;
    function resolveWrapper(resolve, result) {
      if (!resolved) {
        resolved = true;
        resolve(result.slice());
        abortAllRequests();
      }
    }

    return new Promise<Array<ITestProtocolResult>>((resolve) => {
      const promises = Object.keys(EProxyProtocol).map((protocol) =>
        testProtocol(EProxyProtocol[protocol], options)
          .then((result) => resolveWrapper(resolve, [result]))
          .catch(() => {})
      );
      Promise.all(promises)
        .then(() => resolveWrapper(resolve, []))
        .catch(() => resolveWrapper(resolve, []));
    });
  }

  const country = geoip.lookupCountry(options.proxyIP);
  options.websites = options.websites || [];

  const result = await testAllProtocols(options);

  if (!result || result.length === 0) {
    return Promise.reject(new Error('proxy checked, invalid'));
  }

  return result.map((item) => Object.assign(item, { country }));
}
