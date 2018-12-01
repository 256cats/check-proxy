'use strict'
import * as request from 'request-promise-native'
import * as ProxyAgent from 'proxy-agent'
import { IGetOptions, IGetResolve, IGetResolveStats } from './interfaces.d'

export async function get(url: string, options: IGetOptions): Promise<IGetResolve> {
  const jar = request.jar();
  options.cookie && jar.setCookie(request.cookie(options.cookie), url);
  try {
    const requestOptions: any = {
      url,
      method: options.data ? 'POST' : 'GET',
      headers: options.headers,
      form: options.data,
      jar,
      agent: new ProxyAgent(options.proxy),
      time: true,
      resolveWithFullResponse: true,
      timeout: options.timeout * 1000 || 10000
    }

    const response = await request(requestOptions)
    const responseCode = response.statusCode
    const stats: IGetResolveStats = {
      responseCode,
      connectTime: parseInt(response.timings.connect, 10) / 1000,
      totalTime: parseInt(response.timingPhases.total, 10) / 1000,
      firstByte: parseInt(response.timingPhases.firstByte, 10) / 1000,
      receivedLength: Buffer.byteLength(response.body, 'utf8'),
      averageSpeed: Buffer.byteLength(response.body, 'utf8') * 1000 / parseInt(response.timingPhases.total, 10)
    }

    return {
      success: true,
      payload: response.body,
      stats
    }

  } catch(err) {
    if(options.ignoreErrors) {
      return {
        success: false,
        payload: '',
        stats: null
      }
    } else {
      throw err;
    }
  }
}