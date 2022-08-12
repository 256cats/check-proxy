"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var request = require("request-promise-native");
var ProxyAgent = require("proxy-agent");
var promise_timeout_1 = require("promise-timeout");
function default_1() {
    var activeRequests = [];
    function abortAllRequests() {
        activeRequests.forEach(function (request) { return request.abort(); });
        activeRequests = [];
    }
    function get(url, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var jar, timeout, requestOptions, newRequest, response, responseCode, stats, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jar = request.jar();
                        options.cookie && jar.setCookie(request.cookie(options.cookie), url);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        timeout = options.timeout * 1000 || 10000;
                        requestOptions = {
                            url: url,
                            method: options.data ? 'POST' : 'GET',
                            headers: options.headers,
                            form: options.data,
                            jar: jar,
                            agent: new ProxyAgent(options.proxy),
                            time: true,
                            resolveWithFullResponse: true,
                            timeout: timeout,
                            strictSSL: false
                        };
                        newRequest = (0, promise_timeout_1.timeout)(request(requestOptions), timeout);
                        activeRequests.push(newRequest);
                        return [4, newRequest];
                    case 2:
                        response = _a.sent();
                        responseCode = response.statusCode;
                        stats = {
                            responseCode: responseCode,
                            connectTime: parseInt(response.timings.connect, 10) / 1000,
                            totalTime: parseInt(response.timingPhases.total, 10) / 1000,
                            firstByte: parseInt(response.timingPhases.firstByte, 10) / 1000,
                            receivedLength: Buffer.byteLength(response.body, 'utf8'),
                            averageSpeed: (Buffer.byteLength(response.body, 'utf8') * 1000) /
                                parseInt(response.timingPhases.total, 10)
                        };
                        return [2, {
                                success: true,
                                payload: response.body,
                                stats: stats
                            }];
                    case 3:
                        err_1 = _a.sent();
                        if (options.ignoreErrors) {
                            return [2, {
                                    success: false,
                                    payload: '',
                                    stats: null
                                }];
                        }
                        else {
                            throw err_1;
                        }
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    }
    return {
        abortAllRequests: abortAllRequests,
        get: get
    };
}
exports.default = default_1;
