"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Properties = void 0;
class Properties {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/properties', { ...reqOptions, query: query });
    }
    get(propertyID, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        return this.api.request('GET', `/cdn/properties/${encodeURIComponent(propertyID)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/properties', { ...reqOptions, body });
    }
    update(propertyID, patchBody, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/properties/${encodeURIComponent(propertyID)}`, { ...reqOptions, body: patchBody });
    }
    delete(propertyID, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        return this.api.request('DELETE', `/cdn/properties/${encodeURIComponent(propertyID)}`, reqOptions);
    }
    listVersions(propertyID, query = {}, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        return this.api.request('GET', `/cdn/properties/${encodeURIComponent(propertyID)}/versions`, { ...reqOptions, query: query });
    }
    createVersion(propertyID, body, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', `/cdn/properties/${encodeURIComponent(propertyID)}/versions`, { ...reqOptions, body });
    }
    getVersion(propertyID, version, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        if (version === undefined || version === null || version === '')
            throw new Error('version is required');
        return this.api.request('GET', `/cdn/properties/${encodeURIComponent(propertyID)}/versions/${encodeURIComponent(String(version))}`, reqOptions);
    }
    patchVersion(propertyID, version, body, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        if (version === undefined || version === null || version === '')
            throw new Error('version is required');
        if (!body)
            throw new Error('body is required');
        return this.api.request('PATCH', `/cdn/properties/${encodeURIComponent(propertyID)}/versions/${encodeURIComponent(String(version))}`, { ...reqOptions, body });
    }
    deleteVersion(propertyID, version, reqOptions = {}) {
        if (!propertyID)
            throw new Error('propertyID is required');
        if (version === undefined || version === null || version === '')
            throw new Error('version is required');
        return this.api.request('DELETE', `/cdn/properties/${encodeURIComponent(propertyID)}/versions/${encodeURIComponent(String(version))}`, reqOptions);
    }
}
exports.Properties = Properties;
//# sourceMappingURL=Properties.js.map