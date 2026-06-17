"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customers = void 0;
class Customers {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/ngadmin/customers', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('GET', `/ngadmin/customers/${encodeURIComponent(String(id))}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/ngadmin/customers', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/ngadmin/customers/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
    }
}
exports.Customers = Customers;
//# sourceMappingURL=Customers.js.map