"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hostnames = void 0;
class Hostnames {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/hostnames', { ...reqOptions, query: query });
    }
    get(hostname, reqOptions = {}) {
        if (!hostname)
            throw new Error('hostname is required');
        return this.api.request('GET', `/cdn/hostnames/${encodeURIComponent(hostname)}`, reqOptions);
    }
}
exports.Hostnames = Hostnames;
//# sourceMappingURL=Hostnames.js.map