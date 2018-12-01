import {
  EProxyProtocol,
  EWebsiteProtocol
} from './enums'

export interface IGetOptions {
  headers?: {[index: string]: string};
  cookie?: string;
  proxy?: string;
  data?: {[index: string]: string};
  connectTimeout?: number;
  timeout?: number;
  ignoreErrors?: boolean;
}

export interface IGetResolveStats {
  responseCode: number; // seconds
  connectTime: number; // seconds
  totalTime: number; // seconds
  receivedLength: number; // bytes
  averageSpeed: number; // bytes per second
  firstByte?: number;
}

export interface IGetResolve {
  success: boolean;
  payload: string;
  stats: IGetResolveStats;
}

export interface IPingOptions {
  url: string;
  options: IGetOptions;
}

export type ITestWebsitesResult = {[index: string]: IGetResolveStats|boolean};

export interface ICheckProxyWebsite {
  name: string;
  url: string;
  regex: any;
  connectTimeout?: number;
  timeout?: number;
}

export interface ICheckProxyOptions {
  testHost: string;
  proxyIP: string;
  proxyPort: number;
  localIP: string;
  connectTimeout?: number;
  timeout: 60;
  websites?: Array<ICheckProxyWebsite>;
}

export interface ITestProtocolResult extends IGetResolve {
  supportsHttps: boolean;
  protocol: EProxyProtocol;
  ip: string;
  port: number;
  websites?: ITestWebsitesResult;
  country?: string;
}
