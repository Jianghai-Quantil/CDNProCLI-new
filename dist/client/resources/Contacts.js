"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contacts = void 0;
class Contacts {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/ngadmin/contacts', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('GET', `/ngadmin/contacts/${encodeURIComponent(String(id))}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/ngadmin/contacts', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/ngadmin/contacts/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('DELETE', `/ngadmin/contacts/${encodeURIComponent(String(id))}`, reqOptions);
    }
}
exports.Contacts = Contacts;
//# sourceMappingURL=Contacts.js.map