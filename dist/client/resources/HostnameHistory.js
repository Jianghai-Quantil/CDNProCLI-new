"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostnameHistory = void 0;
class HostnameHistory {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/hostnames/historical', { ...reqOptions, query: query });
    }
    get(hostname, query = {}, reqOptions = {}) {
        if (!hostname)
            throw new Error('hostname is required');
        return this.api.request('GET', `/cdn/hostnames/historical/${encodeURIComponent(hostname)}`, { ...reqOptions, query: query });
    }
}
exports.HostnameHistory = HostnameHistory;
//# sourceMappingURL=HostnameHistory.js.map