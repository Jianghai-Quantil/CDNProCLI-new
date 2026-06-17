"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCalls = void 0;
class ApiCalls {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/ngadmin/apicalls', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/ngadmin/apicalls/${encodeURIComponent(id)}`, reqOptions);
    }
}
exports.ApiCalls = ApiCalls;
//# sourceMappingURL=ApiCalls.js.map