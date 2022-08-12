'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = exports.ping = void 0;
var ping_1 = require("./lib/ping");
Object.defineProperty(exports, "ping", { enumerable: true, get: function () { return ping_1.default; } });
var check_proxy_1 = require("./lib/check-proxy");
Object.defineProperty(exports, "check", { enumerable: true, get: function () { return check_proxy_1.default; } });
