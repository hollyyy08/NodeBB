import TTLCache, { Options } from '@isaacs/ttlcache';

interface CacheOptions extends Options<unknown, unknown> {
    name: string;
    enabled?: boolean;
  }

export default function (opts: CacheOptions) {
    const ttlCache = new TTLCache(opts);

    const cache: { [key: string]: unknown } = {
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

    // Other methods ...

    return cache;
}
