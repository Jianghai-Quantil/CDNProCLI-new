"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Secrets = void 0;
class Secrets {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/secrets', { ...reqOptions, query: query });
    }
    get(secretID, reqOptions = {}) {
        if (!secretID)
            throw new Error('secretID is required');
        return this.api.request('GET', `/cdn/secrets/${encodeURIComponent(secretID)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/secrets', { ...reqOptions, body });
    }
    update(secretID, patchBody, reqOptions = {}) {
        if (!secretID)
            throw new Error('secretID is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/secrets/${encodeURIComponent(secretID)}`, { ...reqOptions, body: patchBody });
    }
    delete(secretID, reqOptions = {}) {
        if (!secretID)
            throw new Error('secretID is required');
        return this.api.request('DELETE', `/cdn/secrets/${encodeURIComponent(secretID)}`, reqOptions);
    }
}
exports.Secrets = Secrets;
//# sourceMappingURL=Secrets.js.map