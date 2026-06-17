"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogConfigs = void 0;
class LogConfigs {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/report/logConfigs', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/report/logConfigs/${encodeURIComponent(String(id))}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/report/logConfigs', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/report/logConfigs/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('DELETE', `/cdn/report/logConfigs/${encodeURIComponent(String(id))}`, reqOptions);
    }
}
exports.LogConfigs = LogConfigs;
//# sourceMappingURL=LogConfigs.js.map