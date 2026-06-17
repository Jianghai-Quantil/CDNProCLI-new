"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Annotations = void 0;
class Annotations {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    // annotation list uses POST to /cdn/annotationsList with optional filter body
    list(body = {}, reqOptions = {}) {
        return this.api.request('POST', '/cdn/annotationsList', { ...reqOptions, body });
    }
    get(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/annotations/${encodeURIComponent(String(id))}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/annotations', { ...reqOptions, body });
    }
    update(id, patchBody, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/annotations/${encodeURIComponent(String(id))}`, { ...reqOptions, body: patchBody });
    }
    delete(id, reqOptions = {}) {
        if (id === undefined || id === null || id === '')
            throw new Error('id is required');
        return this.api.request('DELETE', `/cdn/annotations/${encodeURIComponent(String(id))}`, reqOptions);
    }
}
exports.Annotations = Annotations;
//# sourceMappingURL=Annotations.js.map