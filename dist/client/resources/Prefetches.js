"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prefetches = void 0;
class Prefetches {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/prefetches', { ...reqOptions, body });
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/prefetches', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/prefetches/${encodeURIComponent(id)}`, reqOptions);
    }
    tokens(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/prefetches/prefetchTokens', { ...reqOptions, query: query });
    }
}
exports.Prefetches = Prefetches;
//# sourceMappingURL=Prefetches.js.map