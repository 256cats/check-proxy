"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EWebsiteProtocol = exports.EProxyProtocol = void 0;
var EProxyProtocol;
(function (EProxyProtocol) {
    EProxyProtocol["http"] = "http";
    EProxyProtocol["socks5"] = "socks5";
    EProxyProtocol["socks4"] = "socks4";
})(EProxyProtocol = exports.EProxyProtocol || (exports.EProxyProtocol = {}));
var EWebsiteProtocol;
(function (EWebsiteProtocol) {
    EWebsiteProtocol["https"] = "https";
})(EWebsiteProtocol = exports.EWebsiteProtocol || (exports.EWebsiteProtocol = {}));
