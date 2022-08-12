export interface PingResult {
    get: boolean;
    post: boolean;
    cookies: boolean;
    referer: boolean;
    'user-agent': boolean;
    anonymityLevel: 0 | 1;
}
export default function (headers: any, getParams: any, postParams: any, cookies: any): PingResult;
