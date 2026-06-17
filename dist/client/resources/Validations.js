"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validations = void 0;
class Validations {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/validations', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/validations/${encodeURIComponent(id)}`, reqOptions);
    }
    create(body, reqOptions = {}) {
        if (!body)
            throw new Error('body is required');
        return this.api.request('POST', '/cdn/validations', { ...reqOptions, body });
    }
}
exports.Validations = Validations;
//# sourceMappingURL=Validations.js.map