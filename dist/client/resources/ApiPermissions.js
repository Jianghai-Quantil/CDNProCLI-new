"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPermissions = void 0;
class ApiPermissions {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/apiPermissions/${encodeURIComponent(id)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/apiPermissions', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/apiPermissions/${encodeURIComponent(id)}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('DELETE', `/cdn/apiPermissions/${encodeURIComponent(id)}`, reqOptions);
    }
}
exports.ApiPermissions = ApiPermissions;
//# sourceMappingURL=ApiPermissions.js.map