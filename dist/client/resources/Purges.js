"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Purges = void 0;
class Purges {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/purges', { ...reqOptions, body });
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/purges', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/purges/${encodeURIComponent(id)}`, reqOptions);
    }
    summary(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/purges/purgeSummary', { ...reqOptions, query: query });
    }
    tokens(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/purges/purgeTokens', { ...reqOptions, query: query });
    }
}
exports.Purges = Purges;
//# sourceMappingURL=Purges.js.map