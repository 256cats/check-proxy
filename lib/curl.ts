'use strict'
import { Curl, Easy, Multi } from 'node-libcurl'
import { IGetOptions, IGetResolve, IGetResolveStats } from './interfaces.d'

function onData( data: Buffer, n: number, nmemb: number ) {
  this.responseData = this.responseData ? Buffer.concat([this.responseData, data]) : data
  return n * nmemb
}

const onMessage = multi => (err, handle, errCode) => {
  const responseCode = handle.getInfo('RESPONSE_CODE').data
  const responseData = handle.responseData.toString()
  const stats: IGetResolveStats = {
    responseCode: responseCode,
    connectTime: handle.getInfo('CONNECT_TIME').data,
    totalTime: handle.getInfo('TOTAL_TIME').data,
    receivedLength: handle.getInfo('SIZE_DOWNLOAD').data,
    averageSpeed: handle.getInfo('SPEED_DOWNLOAD').data
  }

  if(err) {

    if(handle.ignoreErrors) {
      handle.resolve({
        success: false,
        payload: '',
        stats 
      })
    } else {
      handle.reject(err)
    }
    
  } else {

    handle.resolve({
      success: true,
      payload: responseData,
      stats
    })

  }

  multi.removeHandle(handle)
  handle.close()
  multi.close()
}

export function get(url: string, options: IGetOptions) {
  const multi = new Multi()
  const curl = new Easy()
  curl.setOpt('URL', url)

  if(options.header) {
    curl.setOpt('HTTPHEADER', options.header)
  }

  if(options.cookie) {
    curl.setOpt('COOKIE', options.cookie)
  }

  curl.setOpt('FOLLOWLOCATION', true)
  curl.setOpt('HEADER', false)
  curl.setOpt('FORBID_REUSE', true)

  curl.setOpt('AUTOREFERER', true)
  curl.setOpt('SSL_VERIFYHOST', false)
  curl.setOpt('SSL_VERIFYPEER', false)
  
  curl.setOpt('SSLVERSION', 4) // http://www.b.shuttle.de/hayek/hayek/jochen/wp/blog-en/2012/09/18/curl-hangs-talking-to-a-web-site-through-https-actually-a-tsl-version-issue/
  curl.setOpt('LOW_SPEED_LIMIT', 500) // https://stackoverflow.com/questions/4960021/handle-pycurl-hang-on-twitter-streaming-api
  curl.setOpt('LOW_SPEED_TIME', 20)

  if(options.proxy) {
    curl.setOpt('PROXY', options.proxy)
  }

  if(options.data) {
    curl.setOpt('POSTFIELDS', options.data)
  }

  curl.setOpt('CONNECTTIMEOUT', options.connectTimeout || 6)
  curl.setOpt('TIMEOUT', options.timeout || 10)
  curl.setOpt('WRITEFUNCTION', onData.bind(curl))

  curl.url = url
  curl.proxy = options.proxy
  multi.onMessage(onMessage(multi))

  return new Promise((resolve: (data: IGetResolve) => void, reject: (err: any) => void) => {
    curl.resolve = resolve
    curl.reject = reject
    curl.responseData = new Buffer(0)
    curl.ignoreErrors = options.ignoreErrors
    multi.addHandle(curl)
  })

}