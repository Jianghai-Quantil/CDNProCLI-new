"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAccounts = void 0;
class ApiAccounts {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/ngadmin/apiAccounts', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('GET', `/ngadmin/apiAccounts/${encodeURIComponent(String(id))}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/ngadmin/apiAccounts', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/ngadmin/apiAccounts/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('DELETE', `/ngadmin/apiAccounts/${encodeURIComponent(String(id))}`, reqOptions);
    }
}
exports.ApiAccounts = ApiAccounts;
//# sourceMappingURL=ApiAccounts.js.map