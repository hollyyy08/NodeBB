"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ttlcache_1 = __importDefault(require("@isaacs/ttlcache"));
const pubsub_1 = __importDefault(require("../pubsub"));
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
    cache.del = function (keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        pubsub_1.default.publish(`${cache.name}:ttlCache:del`, keys);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        keys.forEach(key => ttlCache.delete(key));
    };
    cache.delete = cache.del;
    function localReset() {
        ttlCache.clear();
        cache.hits = 0;
        cache.misses = 0;
    }
    cache.reset = function () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        pubsub_1.default.publish(`${cache.name}:ttlCache:reset`);
        localReset();
    };
    cache.clear = cache.reset;
    pubsub_1.default.on(`${cache.name}:ttlCache:reset`, () => {
        localReset();
    });
    pubsub_1.default.on(`${cache.name}:ttlCache:del`, (keys) => {
        if (Array.isArray(keys)) {
            keys.forEach(key => ttlCache.delete(key));
        }
    });
    cache.getUnCachedKeys = function (keys, cachedData) {
        if (!cache.enabled) {
            return keys;
        }
        let data;
        let isCached;
        const unCachedKeys = keys.filter((key) => {
            data = cache.get(key);
            isCached = data !== undefined;
            if (isCached) {
                cachedData[key] = data;
            }
            return !isCached;
        });
        const hits = keys.length - unCachedKeys.length;
        const misses = keys.length - hits;
        cache.hits = cache.hits + hits;
        cache.misses = cache.misses + misses;
        return unCachedKeys;
    };
    cache.dump = function () {
        return Array.from(ttlCache.entries());
    };
    cache.peek = function (key) {
        return ttlCache.get(key, { updateAgeOnGet: false });
    };
    return cache;
}
exports.default = default_1;
