import TTLCache, { Options } from '@isaacs/ttlcache';
import pubsub from '../pubsub';

interface CacheOptions extends Options<unknown, unknown> {
    name: string;
    enabled?: boolean;
  }

export default function (opts: CacheOptions) {
    const ttlCache = new TTLCache(opts);

    const cache: { [key: string]: unknown, get?: (key: string) => unknown} = {
        name: opts.name,
        hits: 0,
        misses: 0,
        enabled: opts.hasOwnProperty('enabled') ? opts.enabled : true,
    };

    const propertyMap = new Map<string, string>([
        ['max', 'max'],
        ['itemCount', 'size'],
        ['size', 'size'],
        ['ttl', 'ttl'],
    ]);

    propertyMap.forEach((ttlProp, cacheProp) => {
        Object.defineProperty(cache, cacheProp, {
            get: function () {
                return ttlCache[ttlProp] as unknown;
            },
            configurable: true,
            enumerable: true,
        });
    });

    cache.set = function (key: string, value: unknown, ttl?: number): void {
        if (!cache.enabled) {
            return;
        }
        const options: { ttl?: number } = {};
        if (ttl) {
            options.ttl = ttl;
        }
        ttlCache.set(key, value, options);
    };

    cache.get = function (key: string): unknown {
        if (!cache.enabled) {
            return undefined;
        }
        const data = ttlCache.get(key);
        if (data === undefined) {
            cache.misses = (cache.misses as number) + 1;
        } else {
            cache.hits = (cache.hits as number) + 1;
        }
        return data;
    };

    cache.del = function (keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        pubsub.publish(`${cache.name as string}:ttlCache:del`, keys);
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
        pubsub.publish(`${cache.name as string}:ttlCache:reset`);
        localReset();
    };
    cache.clear = cache.reset;


    pubsub.on(`${cache.name as string}:ttlCache:reset`, () => {
        localReset();
    });

    pubsub.on(`${cache.name as string}:ttlCache:del`, (keys) => {
        if (Array.isArray(keys)) {
            keys.forEach(key => ttlCache.delete(key));
        }
    });

    cache.getUnCachedKeys = function (keys: string[], cachedData: { [key: string]: unknown }) {
        if (!cache.enabled) {
            return keys;
        }
        let data: unknown;
        let isCached: boolean;

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
        cache.hits = (cache.hits as number) + hits;
        cache.misses = (cache.misses as number) + misses;
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