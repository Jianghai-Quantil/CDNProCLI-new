"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeHostnames = void 0;
class EdgeHostnames {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/edgeHostnames', { ...reqOptions, query: query });
    }
    get(edgeHostname, reqOptions = {}) {
        if (!edgeHostname)
            throw new Error('edgeHostname is required');
        return this.api.request('GET', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/edgeHostnames', { ...reqOptions, body });
    }
    replace(edgeHostname, body, reqOptions = {}) {
        if (!edgeHostname)
            throw new Error('edgeHostname is required');
        if (!body)
            throw new Error('body is required');
        return this.api.request('PUT', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, { ...reqOptions, body });
    }
    update(edgeHostname, patchBody, reqOptions = {}) {
        if (!edgeHostname)
            throw new Error('edgeHostname is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, { ...reqOptions, body: patchBody });
    }
    delete(edgeHostname, reqOptions = {}) {
        if (!edgeHostname)
            throw new Error('edgeHostname is required');
        return this.api.request('DELETE', `/cdn/edgeHostnames/${encodeURIComponent(edgeHostname)}`, reqOptions);
    }
}
exports.EdgeHostnames = EdgeHostnames;
//# sourceMappingURL=EdgeHostnames.js.map