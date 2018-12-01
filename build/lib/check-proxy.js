'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var geoip = require("geoip-ultralight");
var _ = require("lodash");
var enums_1 = require("./enums");
var request_js_1 = require("./request.js");
function pingThroughProxy(url, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var result, proxyData, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, request_js_1.get(url, options)];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error('Request failed');
                    }
                    proxyData = JSON.parse(result.payload || '');
                    proxyData.totalTime = result.stats.totalTime;
                    proxyData.connectTime = result.stats.connectTime;
                    return [2, proxyData];
                case 2:
                    err_1 = _a.sent();
                    return [2, Promise.reject(err_1)];
                case 3: return [2];
            }
        });
    });
}
function createPingRequestOptions(options, proxyProtocol, websiteProtocol) {
    return {
        url: websiteProtocol + "://" + options.testHost + "/?test=get&ip=" + options.localIP,
        options: {
            headers: {
                'User-Agent': 'Mozilla/4.0',
                Accept: 'text/html',
                Referer: 'http://www.google.com',
                Connection: 'close'
            },
            cookie: 'test=cookie;',
            data: { test: 'post' },
            proxy: proxyProtocol + "://" + options.proxyIP + ":" + options.proxyPort,
            timeout: options.timeout,
            connectTimeout: options.connectTimeout
        }
    };
}
function testWebsite(url, proxy, regex, website) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options, result, html;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        headers: {
                            'User-Agent': 'Mozilla/4.0',
                            Accept: 'text/html',
                            Referer: 'http://www.google.com',
                            Connection: 'close'
                        },
                        proxy: proxy,
                        ignoreErrors: true
                    };
                    if (website.connectTimeout) {
                        options.connectTimeout = website.connectTimeout;
                    }
                    if (website.timeout) {
                        options.timeout = website.timeout;
                    }
                    return [4, request_js_1.get(url, options)];
                case 1:
                    result = _a.sent();
                    html = result.payload;
                    if (regex) {
                        if (_.isFunction(regex)) {
                            return [2, regex(html, result) ? result.stats : Promise.reject(new Error('data doesn\'t match provided function'))];
                        }
                        else if (_.isRegExp(regex)) {
                            return [2, regex.test(html) ? result.stats : Promise.reject(new Error('data doesn\'t match provided regex'))];
                        }
                        else {
                            return [2, html.indexOf(regex) != -1 ? result.stats : Promise.reject(new Error('data doesn\'t contain provided string'))];
                        }
                    }
                    return [2, Promise.reject('regex is not set')];
            }
        });
    });
}
function testWebsites(proxy, websites) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var result, _i, websites_1, website, stats, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = {};
                    _i = 0, websites_1 = websites;
                    _a.label = 1;
                case 1:
                    if (!(_i < websites_1.length)) return [3, 6];
                    website = websites_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4, testWebsite(website.url, proxy, website.regex, website)];
                case 3:
                    stats = _a.sent();
                    result[website.name] = stats;
                    return [3, 5];
                case 4:
                    err_2 = _a.sent();
                    result[website.name] = false;
                    return [3, 5];
                case 5:
                    _i++;
                    return [3, 1];
                case 6: return [2, result];
            }
        });
    });
}
function testProtocol(proxyProtocol, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var httpOptions, httpResult, result, httpsOptions, httpsResult, err_3, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    httpOptions = createPingRequestOptions(options, proxyProtocol, enums_1.EWebsiteProtocol.http);
                    return [4, pingThroughProxy(httpOptions.url, httpOptions.options)];
                case 1:
                    httpResult = _b.sent();
                    result = Object.assign({
                        supportsHttps: false,
                        protocol: proxyProtocol,
                        ip: options.proxyIP,
                        port: options.proxyPort
                    }, httpResult);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    httpsOptions = createPingRequestOptions(options, proxyProtocol, enums_1.EWebsiteProtocol.https);
                    return [4, pingThroughProxy(httpsOptions.url, httpsOptions.options)];
                case 3:
                    httpsResult = _b.sent();
                    Object.assign(result, httpsResult);
                    result.supportsHttps = true;
                    return [3, 5];
                case 4:
                    err_3 = _b.sent();
                    return [3, 5];
                case 5:
                    _a = result;
                    return [4, testWebsites(httpOptions.options.proxy, options.websites)];
                case 6:
                    _a.websites = _b.sent();
                    return [2, result];
            }
        });
    });
}
function testAllProtocols(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var result, _i, _a, protocol, protocolResult, err_4;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    result = [];
                    _i = 0, _a = Object.keys(enums_1.EProxyProtocol);
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3, 6];
                    protocol = _a[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4, testProtocol(enums_1.EProxyProtocol[protocol], options)];
                case 3:
                    protocolResult = _b.sent();
                    result.push(protocolResult);
                    return [2, result];
                case 4:
                    err_4 = _b.sent();
                    return [3, 5];
                case 5:
                    _i++;
                    return [3, 1];
                case 6: return [2, result];
            }
        });
    });
}
function default_1(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var country, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    country = geoip.lookupCountry(options.proxyIP);
                    options.websites = options.websites || [];
                    return [4, testAllProtocols(options)];
                case 1:
                    result = _a.sent();
                    if (result.length === 0) {
                        return [2, Promise.reject('proxy checked, invalid')];
                    }
                    return [2, result.map(function (item) { return Object.assign(item, { country: country }); })];
            }
        });
    });
}
exports.default = default_1;
