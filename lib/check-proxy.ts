'use strict'
import * as geoip from 'geoip-ultralight'
import * as _ from 'lodash'
import { 
  IGetOptions,
  IGetResolveStats,
  ICheckProxyOptions,
  IPingOptions,
  IGetResolve,
  ICheckProxyWebsite,
  ITestWebsitesResult,
  ITestProtocolResult
} from './interfaces.d'
import {
  EProxyProtocol,
  EWebsiteProtocol
} from './enums'
import { get } from './curl.js'

const pingThroughProxy = async (url: string, options: IGetOptions): Promise<IGetResolve> => {
  try {
    const result = await get(url, options)
    
    if(!result.success) {
      throw 'Request failed'
    }

    const proxyData: any = JSON.parse(result.payload || '')
    proxyData.totalTime = result.stats.totalTime
    proxyData.connectTime = result.stats.connectTime
    return proxyData

  } catch(err) {
    return Promise.reject(err)
  }
}

const createPingRequestOptions = (options: ICheckProxyOptions, proxyProtocol: EProxyProtocol, websiteProtocol: EWebsiteProtocol): IPingOptions => ({
  url: websiteProtocol + '://' + options.testHost + '/?test=get&ip=' + options.localIP,
  options: {
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Referer: http://www.google.com',
      'Connection: close'
    ],
    cookie: 'test=cookie;',
    data: "test=post",
    proxy: proxyProtocol + '://' + options.proxyIP + ':' + options.proxyPort,
    timeout: options.timeout,
    connectTimeout: options.connectTimeout
  }
})

async function testWebsite(url: string, proxy: string, regex: any, website: ICheckProxyWebsite): Promise<IGetResolveStats> {
  const options: IGetOptions = {
    header: [
      'User-Agent: Mozilla/4.0',
      'Accept: text/html',
      'Connection: close'
    ],
    proxy: proxy,
    ignoreErrors: true
  }

  if(website.connectTimeout) {
    options.connectTimeout = website.connectTimeout
  }
  
  if(website.timeout) {
    options.timeout = website.timeout
  }

  const result = await get(url, options)
  const html = result.payload
  
  if(regex) {
    if(_.isFunction(regex)) {
      return regex(html, result) ? result.stats : Promise.reject('data doesn\'t match provided function')
    } else if(_.isRegExp(regex)) {
      return regex.test(html) ? result.stats : Promise.reject('data doesn\'t match provided regex')
    } else {
      return html.indexOf(regex) != -1 ? result.stats : Promise.reject('data doesn\'t contain provided string')
    }
  }
  
  return Promise.reject('regex is not set')
}

async function testWebsites(proxy: string, websites: Array<ICheckProxyWebsite>): Promise<ITestWebsitesResult> {
  const result: ITestWebsitesResult = {}
  for(let website of websites) {
    try {
      const stats = await testWebsite(website.url, proxy, website.regex, website)
      result[website.name] = stats
    } catch(err) {
      result[website.name] = false
    }
  }
  return result
}

async function testProtocol(proxyProtocol: EProxyProtocol, options: ICheckProxyOptions): Promise<ITestProtocolResult> {
  const httpOptions = createPingRequestOptions(options, proxyProtocol, EWebsiteProtocol.http)
  const httpResult = await pingThroughProxy(httpOptions.url, httpOptions.options)

  const result: ITestProtocolResult = Object.assign({
    supportsHttps: false,
    protocol: proxyProtocol,
    ip: options.proxyIP,
    port: options.proxyPort
  }, httpResult)
  
  try { // check https after http
    const httpsOptions = createPingRequestOptions(options, proxyProtocol, EWebsiteProtocol.https)
    const resHttps = await pingThroughProxy(httpsOptions.url, httpsOptions.options)
    result.supportsHttps = true
  } catch(err) {}

  result.websites = await testWebsites(httpOptions.options.proxy, options.websites)

  return result
}

async function testAllProtocols(options: ICheckProxyOptions): Promise<Array<ITestProtocolResult>> {
  const result: Array<ITestProtocolResult> = []

  for(let protocol of Object.keys(EProxyProtocol)) {
    try {
      const protocolResult = await testProtocol(EProxyProtocol[protocol], options)
      result.push(protocolResult)
      return result // if one working protocol found => return immediately to speed up testing
    } catch(err) {}
  }

  return result
}

export default async function(options: ICheckProxyOptions): Promise<Array<ITestProtocolResult>> {
  const country = geoip.lookupCountry(options.proxyIP)
  options.websites = options.websites || []

  const result = await testAllProtocols(options)

  if(result.length === 0) {
    return Promise.reject('proxy checked, invalid')
  }

  return result.map(item => Object.assign(item, { country }))
}