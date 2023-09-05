"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ttlcache_1 = __importDefault(require("@isaacs/ttlcache"));
function default_1(opts) {
    const ttlCache = new ttlcache_1.default(opts);
    const cache = {
        name: opts.name,
        hits: 0,
        misses: 0,
        enabled: opts.hasOwnProperty('enabled') ? opts.enabled : true,
    };
    const propertyMap = new Map([
        ['max', 'max'],
        ['itemCount', 'size'],
        ['size', 'size'],
        ['ttl', 'ttl'],
    ]);
    propertyMap.forEach((ttlProp, cacheProp) => {
        Object.defineProperty(cache, cacheProp, {
            get: function () {
                return ttlCache[ttlProp];
            },
            configurable: true,
            enumerable: true,
        });
    });
    cache.set = function (key, value, ttl) {
        if (!cache.enabled) {
            return;
        }
        const options = {};
        if (ttl) {
            options.ttl = ttl;
        }
        ttlCache.set(key, value, options);
    };
    cache.get = function (key) {
        if (!cache.enabled) {
            return undefined;
        }
        const data = ttlCache.get(key);
        if (data === undefined) {
            cache.misses = cache.misses + 1;
        }
        else {
            cache.hits = cache.hits + 1;
        }
        return data;
    };
    // Other methods ...
    return cache;
}
exports.default = default_1;
