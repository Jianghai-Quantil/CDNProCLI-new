"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhooks = void 0;
class Webhooks {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/webhooks', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/webhooks/${encodeURIComponent(id)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/webhooks', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/webhooks/${encodeURIComponent(id)}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('DELETE', `/cdn/webhooks/${encodeURIComponent(id)}`, reqOptions);
    }
}
exports.Webhooks = Webhooks;
//# sourceMappingURL=Webhooks.js.map