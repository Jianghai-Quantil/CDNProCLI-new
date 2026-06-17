"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shields = void 0;
class Shields {
    api;
    constructor(apiCore) {
        this.api = apiCore;
    }
    list(query = {}, reqOptions = {}) {
        return this.api.request('GET', '/cdn/shields', { ...reqOptions, query: query });
    }
    get(id, reqOptions = {}) {
        if (!id)
            throw new Error('id is required');
        return this.api.request('GET', `/cdn/shields/${encodeURIComponent(id)}`, reqOptions);
    }
}
exports.Shields = Shields;
//# sourceMappingURL=Shields.js.map