'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var node_libcurl_1 = require("node-libcurl");
function onData(data, n, nmemb) {
    this.responseData = this.responseData ? Buffer.concat([this.responseData, data]) : data;
    return n * nmemb;
}
var onMessage = function (multi) { return function (err, handle, errCode) {
    var responseCode = handle.getInfo('RESPONSE_CODE').data;
    var responseData = handle.responseData.toString();
    var stats = {
        responseCode: responseCode,
        connectTime: handle.getInfo('CONNECT_TIME').data,
        totalTime: handle.getInfo('TOTAL_TIME').data,
        receivedLength: handle.getInfo('SIZE_DOWNLOAD').data,
        averageSpeed: handle.getInfo('SPEED_DOWNLOAD').data
    };
    if (err) {
        if (handle.ignoreErrors) {
            handle.resolve({
                success: false,
                payload: '',
                stats: stats
            });
        }
        else {
            handle.reject(err);
        }
    }
    else {
        handle.resolve({
            success: true,
            payload: responseData,
            stats: stats
        });
    }
    multi.removeHandle(handle);
    handle.close();
    multi.close();
}; };
function get(url, options) {
    var multi = new node_libcurl_1.Multi();
    var curl = new node_libcurl_1.Easy();
    curl.setOpt('URL', url);
    if (options.header) {
        curl.setOpt('HTTPHEADER', options.header);
    }
    if (options.cookie) {
        curl.setOpt('COOKIE', options.cookie);
    }
    curl.setOpt('FOLLOWLOCATION', true);
    curl.setOpt('HEADER', false);
    curl.setOpt('FORBID_REUSE', true);
    curl.setOpt('AUTOREFERER', true);
    curl.setOpt('SSL_VERIFYHOST', false);
    curl.setOpt('SSL_VERIFYPEER', false);
    curl.setOpt('SSLVERSION', 4);
    curl.setOpt('LOW_SPEED_LIMIT', 500);
    curl.setOpt('LOW_SPEED_TIME', 20);
    if (options.proxy) {
        curl.setOpt('PROXY', options.proxy);
    }
    if (options.data) {
        curl.setOpt('POSTFIELDS', options.data);
    }
    curl.setOpt('CONNECTTIMEOUT', options.connectTimeout || 6);
    curl.setOpt('TIMEOUT', options.timeout || 10);
    curl.setOpt('WRITEFUNCTION', onData.bind(curl));
    curl.url = url;
    curl.proxy = options.proxy;
    multi.onMessage(onMessage(multi));
    return new Promise(function (resolve, reject) {
        curl.resolve = resolve;
        curl.reject = reject;
        curl.responseData = new Buffer(0);
        curl.ignoreErrors = options.ignoreErrors;
        multi.addHandle(curl);
    });
}
exports.get = get;
