"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certificates = void 0;
class Certificates {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/certificates', { ...reqOptions, query: query });
    }
    get(certificateID, reqOptions = {}) {
        if (!certificateID)
            throw new Error('certificateID is required');
        return this.api.request('GET', `/cdn/certificates/${encodeURIComponent(certificateID)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/certificates', { ...reqOptions, body });
    }
    update(certificateID, patchBody, reqOptions = {}) {
        if (!certificateID)
            throw new Error('certificateID is required');
        if (!patchBody)
            throw new Error('patchBody is required');
        return this.api.request('PATCH', `/cdn/certificates/${encodeURIComponent(certificateID)}`, { ...reqOptions, body: patchBody });
    }
    delete(certificateID, reqOptions = {}) {
        if (!certificateID)
            throw new Error('certificateID is required');
        return this.api.request('DELETE', `/cdn/certificates/${encodeURIComponent(certificateID)}`, reqOptions);
    }
    downloadCSR(certificateID, query = {}, reqOptions = {}) {
        if (!certificateID)
            throw new Error('certificateID is required');
        return this.api.request('GET', `/cdn/certificates/${encodeURIComponent(certificateID)}/csr`, { ...reqOptions, query: query });
    }
    getVersion(certificateID, version, reqOptions = {}) {
        if (!certificateID)
            throw new Error('certificateID is required');
        if (version === undefined || version === null || version === '')
            throw new Error('version is required');
        return this.api.request('GET', `/cdn/certificates/${encodeURIComponent(certificateID)}/versions/${encodeURIComponent(String(version))}`, reqOptions);
    }
    deleteVersion(certificateID, version, reqOptions = {}) {
        if (!certificateID)
            throw new Error('certificateID is required');
        if (version === undefined || version === null || version === '')
            throw new Error('version is required');
        return this.api.request('DELETE', `/cdn/certificates/${encodeURIComponent(certificateID)}/versions/${encodeURIComponent(String(version))}`, reqOptions);
    }
}
exports.Certificates = Certificates;
//# sourceMappingURL=Certificates.js.map